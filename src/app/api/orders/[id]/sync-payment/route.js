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
  } else if (order.payment_method === "sofizpay" && order.sofizpay_transaction_id) {
    const status = await checkCibStatus(order.sofizpay_transaction_id);
    if (status) paymentStatus = mapCibStatus(status);
  } else {
    return NextResponse.json({ payment_status: order.payment_status });
  }

  db.prepare(
    `UPDATE orders SET payment_status = ?, status = CASE WHEN ? = 'paid' AND status = 'pending' THEN 'confirmed' ELSE status END WHERE id = ?`
  ).run(paymentStatus, paymentStatus, order.id);

  return NextResponse.json({ payment_status: paymentStatus });
}
