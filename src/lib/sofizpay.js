/**
 * SofizPay adapter — CIB/Edahabiya hosted payments, built directly against
 * SofizPay's official docs (docs.sofizpay.com/en/api/v1/endpoints/...),
 * confirmed by screenshot on 2026-08-10:
 *
 *   Create payment:  GET https://sofizpay.com/make-cib-transaction/
 *     Query params: account, amount, full_name, phone, email,
 *                   return_url (optional), webhook_url (optional),
 *                   invoice_id (optional), language (optional, 'ar' default)
 *
 *   Check status:    GET https://sofizpay.com/cib-transaction-check/
 *     Query params: order_number (required)
 *     Success shape: { order_number, orderStatus, errorCode, errorMessage,
 *                      actionCodeDescription, respCode_desc, respCode,
 *                      destination_account, Amount }
 *
 * IMPORTANT gaps we could not confirm from the docs (be aware before going
 * fully live):
 *   - The exact shape of what SofizPay appends to `return_url` / sends to
 *     `webhook_url` after a payment attempt isn't fully documented in what
 *     we've seen. To stay safe, this adapter never trusts an incoming
 *     redirect or webhook payload's status directly — it only uses them as
 *     a *trigger* to re-check status via the authoritative
 *     cib-transaction-check endpoint, using whatever order_number we can
 *     find (see src/app/api/webhooks/sofizpay/route.js and the order detail
 *     page). This is standard defense-in-depth even when signatures ARE
 *     available, and is essential here since we don't have a confirmed
 *     signature-verification scheme to check webhook authenticity.
 *   - Because we don't create-and-store a transaction id up front (this API
 *     has no such step — you just build the URL), we rely on `invoice_id`
 *     (set to our internal order id) to link a SofizPay order_number back
 *     to the right order once we learn about it.
 *
 * Required env vars:
 *   SOFIZPAY_MERCHANT_ACCOUNT — your merchant Stellar public key (starts with 'G')
 *
 * Reminder: per SofizPay's own docs, payments settle as "DZT", a token on
 * the Stellar blockchain network representing DZD, to your merchant
 * account — not a direct bank deposit. Confirm this is legally acceptable
 * for your business before enabling SOFIZPAY_SANDBOX=false.
 */

const SOFIZPAY_MERCHANT_ACCOUNT = process.env.SOFIZPAY_MERCHANT_ACCOUNT || "";
const SOFIZPAY_SANDBOX = process.env.SOFIZPAY_SANDBOX !== "false"; // default to sandbox until explicitly turned off

const CREATE_URL = "https://sofizpay.com/make-cib-transaction/";
const STATUS_URL = "https://sofizpay.com/cib-transaction-check/";

export function isSofizPayConfigured() {
  return Boolean(SOFIZPAY_MERCHANT_ACCOUNT);
}

/**
 * Builds the hosted CIB/Edahabiya payment URL to redirect the customer to.
 * No network call needed — per SofizPay's docs this is a direct GET link
 * you construct yourself, not a "create then get an id back" API call.
 */
export function buildCibPaymentUrl({ amount, orderId, fullName, phone, email, baseUrl, locale = "ar" }) {
  if (!isSofizPayConfigured()) {
    throw new Error("sofizpay_not_configured");
  }

  const params = new URLSearchParams({
    account: SOFIZPAY_MERCHANT_ACCOUNT,
    amount: String(amount),
    full_name: fullName,
    phone,
    return_url: `${baseUrl}/account/orders/${orderId}?success=1&gateway=sofizpay`,
    webhook_url: `${baseUrl}/api/webhooks/sofizpay`,
    invoice_id: String(orderId),
    language: locale === "fr" ? "fr" : "ar",
  });
  if (email) params.set("email", email);

  return `${CREATE_URL}?${params.toString()}`;
  // Note: SOFIZPAY_SANDBOX currently has no effect here because the docs we
  // could confirm don't show a separate sandbox host/path for this
  // endpoint. If your SofizPay dashboard shows a sandbox variant, update
  // CREATE_URL/STATUS_URL above accordingly before relying on this flag.
}

/** Authoritative status check — always call this rather than trusting a
 * redirect or webhook payload directly. */
export async function checkCibStatus(orderNumber) {
  if (!orderNumber) return null;

  const url = `${STATUS_URL}?${new URLSearchParams({ order_number: orderNumber }).toString()}`;
  const res = await fetch(url);
  if (!res.ok) return null;

  let data;
  try {
    data = await res.json();
  } catch {
    return null;
  }

  return data || null;
}

/** Maps a SofizPay orderStatus/respCode to our internal payment_status values. */
export function mapCibStatus(statusResponse) {
  if (!statusResponse) return "unpaid";
  if (statusResponse.respCode === "00" || statusResponse.orderStatus === 2) return "paid";
  if (statusResponse.errorCode && statusResponse.errorCode !== 0) return "failed";
  return "unpaid";
}
