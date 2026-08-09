import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(id);
  if (!order) return NextResponse.json({ error: "not_found" }, { status: 404 });
  if (order.user_id !== user.id && user.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(id);

  return NextResponse.json({ order, items });
}
