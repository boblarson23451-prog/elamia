import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCarriers } from "@/lib/shipping";

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

  // Attach carrier labels here so client pages never import the shipping
  // module (which touches the database and can't run in the browser).
  const c = getCarriers()[order.shipping_carrier];
  const enriched = {
    ...order,
    carrier_label_fr: c?.label_fr || null,
    carrier_label_ar: c?.label_ar || null,
    carrier_eta_fr: c?.eta_fr || null,
    carrier_eta_ar: c?.eta_ar || null,
  };

  return NextResponse.json({ order: enriched, items });
}
