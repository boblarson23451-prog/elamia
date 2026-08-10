import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCheckout, mapCheckoutStatus } from "@/lib/chargily";
import { checkCibStatus, mapCibStatus } from "@/lib/sofizpay";

export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let paymentStatus = order.payment_status;

  if (order.payment_method === "chargily" && order.chargily_checkout_id) {
    const checkout = await getCheckout(order.chargily_checkout_id);
    if (checkout) paymentStatus = mapCheckoutStatus(checkout.status);
  } else if (order.payment_method === "sofizpay") {
    // We only know SofizPay's order_number once their webhook/redirect tells
    // us — until then there's nothing authoritative to poll.
    if (!order.sofizpay_transaction_id) {
      return NextResponse.json({ payment_status: order.payment_status, pending_confirmation: true });
    }
    const statusResponse = await checkCibStatus(order.sofizpay_transaction_id);
    if (statusResponse) {
      const mapped = mapCibStatus(statusResponse);
      // Guard against underpayment before accepting a 'paid' result.
      if (mapped === "paid" && statusResponse.Amount != null) {
        const paidAmount = Number(statusResponse.Amount);
        if (Number.isFinite(paidAmount) && paidAmount + 0.01 < order.total) {
          return NextResponse.json({ payment_status: order.payment_status, amount_mismatch: true });
        }
      }
      paymentStatus = mapped;
    }
  } else {
    return NextResponse.json({ payment_status: order.payment_status });
  }

  db.prepare(
    `UPDATE orders SET payment_status = ?, status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?`
  ).run(paymentStatus, paymentStatus, order.id);

  return NextResponse.json({ payment_status: paymentStatus });
}
