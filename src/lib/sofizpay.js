/**
 * SofizPay adapter — generates hosted CIB/Dahabia payment links and checks
 * their status, following the request/response shape documented in
 * SofizPay's official SDKs (see docs.sofizpay.com and
 * github.com/kenandarabeh/sofizpay-sdk-python).
 *
 * IMPORTANT — before this goes live, you must fill in:
 *   SOFIZPAY_API_BASE_URL   — the real API base URL from your SofizPay
 *                             merchant dashboard (docs.sofizpay.com). We
 *                             could not independently verify this URL from
 *                             public docs, so it is intentionally left
 *                             blank rather than guessed.
 *   SOFIZPAY_MERCHANT_ACCOUNT — your merchant Stellar public key (starts with 'G'),
 *                             issued when your merchant registration
 *                             (registre de commerce, NIF) is approved.
 *   SOFIZPAY_API_KEY        — your API key/secret, if SofizPay requires one
 *                             for server-to-server calls (check your dashboard).
 *
 * Note on how funds move: per SofizPay's own documentation, payments settle
 * as "DZT" — a token on the Stellar blockchain network representing DZD —
 * to your merchant Stellar account, not as a direct bank deposit. Make sure
 * you understand and are comfortable with that settlement mechanism (and
 * its legal standing under Algerian law) before enabling this in production.
 */

const SOFIZPAY_API_BASE_URL = process.env.SOFIZPAY_API_BASE_URL || "";
const SOFIZPAY_MERCHANT_ACCOUNT = process.env.SOFIZPAY_MERCHANT_ACCOUNT || "";
const SOFIZPAY_API_KEY = process.env.SOFIZPAY_API_KEY || "";
const SOFIZPAY_SANDBOX = process.env.SOFIZPAY_SANDBOX !== "false"; // default to sandbox until explicitly turned off

export function isSofizPayConfigured() {
  return Boolean(SOFIZPAY_API_BASE_URL && SOFIZPAY_MERCHANT_ACCOUNT);
}

function authHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (SOFIZPAY_API_KEY) headers.Authorization = `Bearer ${SOFIZPAY_API_KEY}`;
  return headers;
}

/**
 * Creates a hosted CIB/Dahabia payment link for an order and returns the
 * URL to redirect the customer to, plus the transaction id to store and
 * later verify server-side.
 */
export async function createCibTransaction({ amount, orderId, fullName, phone, email, baseUrl }) {
  if (!isSofizPayConfigured()) {
    throw new Error("sofizpay_not_configured");
  }

  const endpoint = `${SOFIZPAY_API_BASE_URL}/${SOFIZPAY_SANDBOX ? "sandbox/" : ""}cib/transactions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      account: SOFIZPAY_MERCHANT_ACCOUNT,
      amount,
      full_name: fullName,
      phone,
      email: email || undefined,
      memo: `Commande #${orderId}`.slice(0, 28),
      return_url: `${baseUrl}/account/orders/${orderId}?success=1`,
      redirect: "no",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data?.success) {
    throw new Error(data?.error || "sofizpay_transaction_failed");
  }

  return {
    transactionId: data.data.cib_transaction_id,
    paymentUrl: data.data.payment_url,
  };
}

/** Polls SofizPay for the current status of a previously-created CIB transaction. */
export async function checkCibStatus(transactionId) {
  if (!isSofizPayConfigured()) return null;

  const endpoint = `${SOFIZPAY_API_BASE_URL}/${SOFIZPAY_SANDBOX ? "sandbox/" : ""}cib/transactions/${transactionId}`;
  const res = await fetch(endpoint, { headers: authHeaders() });
  if (!res.ok) return null;

  const data = await res.json();
  if (!data?.success) return null;

  return data.data?.status || null;
}

/** Maps a SofizPay CIB transaction status to our internal payment_status values. */
export function mapCibStatus(sofizpayStatus) {
  if (sofizpayStatus === "success" || sofizpayStatus === "paid") return "paid";
  if (sofizpayStatus === "failed" || sofizpayStatus === "expired" || sofizpayStatus === "cancelled") return "failed";
  return "unpaid";
}
