import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireVendor } from "@/lib/auth";

export async function GET() {
  let vendor;
  try {
    ({ vendor } = await requireVendor());
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const rows = db
    .prepare(
      `SELECT oi.id as item_id, oi.name_ar, oi.name_fr, oi.price, oi.quantity,
              o.id as order_id, o.status, o.wilaya, o.phone, o.full_name, o.created_at
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE oi.vendor_id = ?
       ORDER BY o.created_at DESC`
    )
    .all(vendor.id);

  const stats = {
    totalOrders: new Set(rows.map((r) => r.order_id)).size,
    totalRevenue: rows.reduce((s, r) => s + r.price * r.quantity, 0),
  };

  return NextResponse.json({ items: rows, stats });
}
