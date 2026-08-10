import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyWebhookSignature, mapCheckoutStatus } from "@/lib/chargily";

export async function POST(req) {
  const rawBody = await req.text();
  const signature = req.headers.get("signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 403 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const checkout = event?.data;
  const orderId = checkout?.metadata?.order_id;
  const checkoutStatus = checkout?.status;

  if (!checkout || !checkoutStatus) {
    // Not a checkout event we care about (or malformed) — acknowledge anyway
    // so Chargily doesn't keep retrying.
    return NextResponse.json({ ok: true });
  }

  const paymentStatus = mapCheckoutStatus(checkoutStatus);

  const target = orderId
    ? db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId)
    : db.prepare("SELECT * FROM orders WHERE chargily_checkout_id = ?").get(checkout.id);

  if (!target) {
    return NextResponse.json({ ok: true });
  }

  db.prepare(
    `UPDATE orders SET payment_status = ?, status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?`
  ).run(paymentStatus, paymentStatus, target.id);

  return NextResponse.json({ ok: true });
}
