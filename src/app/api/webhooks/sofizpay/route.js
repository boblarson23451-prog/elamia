import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkCibStatus, mapCibStatus } from "@/lib/sofizpay";

/**
 * SofizPay webhook receiver.
 *
 * SECURITY NOTE: we do not have a documented signature-verification scheme
 * for SofizPay webhooks, so this endpoint treats the incoming payload as
 * UNTRUSTED. It never marks an order paid based on what the payload claims.
 * It only extracts an order_number + invoice_id, then independently
 * re-queries SofizPay's cib-transaction-check endpoint to get the real
 * status. That way a forged webhook can't mark an order paid.
 */

function pick(obj, keys) {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj[k] !== null && obj[k] !== "") return String(obj[k]);
  }
  return null;
}

async function handle(payload) {
  const orderNumber = pick(payload, ["order_number", "orderNumber", "orderId", "order_id"]);
  const invoiceId = pick(payload, ["invoice_id", "invoiceId"]);

  if (!orderNumber) {
    return NextResponse.json({ received: true, note: "no order_number in payload" });
  }

  // Authoritative check against SofizPay, ignoring whatever status the payload claimed.
  const statusResponse = await checkCibStatus(orderNumber);
  const paymentStatus = mapCibStatus(statusResponse);

  // Link back to our order: prefer invoice_id (we set it to our order id),
  // otherwise fall back to a previously-stored transaction id.
  let order = null;
  if (invoiceId) {
    order = db.prepare("SELECT * FROM orders WHERE id = ? AND payment_method = 'sofizpay'").get(invoiceId);
  }
  if (!order) {
    order = db.prepare("SELECT * FROM orders WHERE sofizpay_transaction_id = ?").get(orderNumber);
  }
  if (!order) {
    return NextResponse.json({ received: true, note: "order not found" });
  }

  // Sanity check: never mark paid if the confirmed amount is short of the order total.
  if (paymentStatus === "paid" && statusResponse?.Amount != null) {
    const paidAmount = Number(statusResponse.Amount);
    if (Number.isFinite(paidAmount) && paidAmount + 0.01 < order.total) {
      db.prepare("UPDATE orders SET sofizpay_transaction_id = ? WHERE id = ?").run(orderNumber, order.id);
      return NextResponse.json({ received: true, note: "amount mismatch, not marking paid" });
    }
  }

  db.prepare(
    `UPDATE orders
     SET sofizpay_transaction_id = ?,
         payment_status = ?,
         status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END
     WHERE id = ?`
  ).run(orderNumber, paymentStatus, paymentStatus, order.id);

  return NextResponse.json({ received: true });
}

export async function POST(req) {
  let payload = {};
  try {
    payload = await req.json();
  } catch {
    // Some gateways post form-encoded instead of JSON
    try {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    } catch {
      payload = {};
    }
  }
  return handle(payload);
}

// SofizPay may also call back via GET with query params.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  return handle(Object.fromEntries(searchParams.entries()));
}
