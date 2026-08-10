import crypto from "crypto";

const CHARGILY_MODE = process.env.CHARGILY_MODE === "live" ? "live" : "test";
const CHARGILY_API_KEY = process.env.CHARGILY_API_KEY || "";
const API_BASE = `https://pay.chargily.net/${CHARGILY_MODE}/api/v2`;

export function isChargilyConfigured() {
  return Boolean(CHARGILY_API_KEY);
}

/**
 * Creates a Chargily Pay checkout for a given order and returns the
 * hosted payment page URL to redirect the customer to.
 * amount is a plain integer number of Algerian Dinars (DZD), no conversion needed.
 */
export async function createCheckout({ amount, orderId, baseUrl, locale = "ar" }) {
  if (!isChargilyConfigured()) {
    throw new Error("chargily_not_configured");
  }

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CHARGILY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
      currency: "dzd",
      locale,
      success_url: `${baseUrl}/account/orders/${orderId}?success=1`,
      failure_url: `${baseUrl}/checkout?payment_failed=1`,
      webhook_endpoint: `${baseUrl}/api/webhooks/chargily`,
      metadata: { order_id: String(orderId) },
      description: `ELALAMIA — commande #${orderId}`,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "chargily_checkout_failed");
  }

  return { checkoutId: data.id, checkoutUrl: data.checkout_url };
}

export async function getCheckout(checkoutId) {
  const res = await fetch(`${API_BASE}/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${CHARGILY_API_KEY}` },
  });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Verifies the `signature` header Chargily sends on every webhook request.
 * Must be called with the RAW request body text (not re-serialized JSON),
 * since HMACs are sensitive to exact byte content.
 */
export function verifyWebhookSignature(rawBody, signatureHeader) {
  if (!signatureHeader || !CHARGILY_API_KEY) return false;
  const expected = crypto.createHmac("sha256", CHARGILY_API_KEY).update(rawBody, "utf8").digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Maps a Chargily checkout status to our internal payment_status values. */
export function mapCheckoutStatus(chargilyStatus) {
  if (chargilyStatus === "paid") return "paid";
  if (chargilyStatus === "failed" || chargilyStatus === "expired" || chargilyStatus === "canceled") return "failed";
  return "unpaid";
}
