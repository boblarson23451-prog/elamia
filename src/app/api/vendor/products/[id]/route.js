import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireVendor } from "@/lib/auth";

export async function GET(req, { params }) {
  let vendor;
  try { ({ vendor } = await requireVendor()); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;
  const product = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!product || product.vendor_id !== vendor.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ product });
}

export async function PATCH(req, { params }) {
  let vendor;
  try {
    ({ vendor } = await requireVendor());
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const { id } = await params;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing || existing.vendor_id !== vendor.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await req.json();
  const fields = [
    "name_ar", "name_fr", "description_ar", "description_fr",
    "price", "compare_at_price", "category_id", "image_seed", "image_urls", "supplier_ref", "weight_grams", "stock", "is_active",
  ];

  const updates = [];
  const values = [];
  for (const f of fields) {
    if (body[f] !== undefined) {
      updates.push(`${f} = ?`);
      values.push(body[f]);
    }
  }
  if (updates.length === 0) return NextResponse.json({ error: "no_fields" }, { status: 400 });

  values.push(id);
  db.prepare(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  let vendor;
  try {
    ({ vendor } = await requireVendor());
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const { id } = await params;
  const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id);
  if (!existing || existing.vendor_id !== vendor.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  db.prepare("UPDATE products SET is_active = 0 WHERE id = ?").run(id);

  return NextResponse.json({ ok: true });
}
