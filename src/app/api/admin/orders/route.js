import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const orders = db
    .prepare(
      `SELECT o.*, u.name as customer_name, u.email as customer_email
       FROM orders o JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC`
    )
    .all();

  const stats = {
    totalOrders: orders.length,
    totalRevenue: orders.reduce((s, o) => s + o.total, 0),
    totalProducts: db.prepare("SELECT COUNT(*) as c FROM products WHERE is_active = 1").get().c,
  };

  return NextResponse.json({ orders, stats });
}
