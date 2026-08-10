import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { checkCibStatus, mapCibStatus } from "@/lib/sofizpay";

/**
 * Called when a customer lands back on their order page from SofizPay with
 * an order_number in the return URL. Like the webhook, this treats the
 * incoming value as untrusted: it stores the order_number for future polling
 * but only marks the order paid after independently verifying with SofizPay.
 */
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const { orderNumber } = await req.json();
  if (!orderNumber) return NextResponse.json({ error: "missing_order_number" }, { status: 400 });

  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (order.payment_method !== "sofizpay") {
    return NextResponse.json({ error: "wrong_payment_method" }, { status: 400 });
  }

  const statusResponse = await checkCibStatus(orderNumber);
  let paymentStatus = mapCibStatus(statusResponse);

  if (paymentStatus === "paid" && statusResponse?.Amount != null) {
    const paidAmount = Number(statusResponse.Amount);
    if (Number.isFinite(paidAmount) && paidAmount + 0.01 < order.total) {
      db.prepare("UPDATE orders SET sofizpay_transaction_id = ? WHERE id = ?").run(orderNumber, order.id);
      return NextResponse.json({ payment_status: order.payment_status, amount_mismatch: true });
    }
  }

  db.prepare(
    `UPDATE orders
     SET sofizpay_transaction_id = ?,
         payment_status = ?,
         status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END
     WHERE id = ?`
  ).run(orderNumber, paymentStatus, paymentStatus, order.id);

  return NextResponse.json({ payment_status: paymentStatus });
}
