import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireVendor } from "@/lib/auth";
import { uniqueSlug } from "@/lib/slug";


export async function GET() {
  let vendor;
  try {
    ({ vendor } = await requireVendor());
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const products = db
    .prepare(
      `SELECT p.*, c.name_ar as category_name_ar, c.name_fr as category_name_fr
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.vendor_id = ?
       ORDER BY p.created_at DESC`
    )
    .all(vendor.id);

  return NextResponse.json({ products });
}

export async function POST(req) {
  let vendor;
  try {
    ({ vendor } = await requireVendor());
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const body = await req.json();
  const { name_ar, name_fr, description_ar, description_fr, price, compare_at_price, category_id, image_seed, stock, weight_grams, image_urls, supplier_ref } = body;

  if (!name_ar || !name_fr || !price || !category_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const slug = uniqueSlug(db, name_fr || name_ar);

  const info = db
    .prepare(
      `INSERT INTO products (slug, name_ar, name_fr, description_ar, description_fr, price, compare_at_price, category_id, vendor_id, image_seed, image_urls, supplier_ref, weight_grams, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      slug,
      name_ar,
      name_fr,
      description_ar || "",
      description_fr || "",
      price,
      compare_at_price || null,
      category_id,
      vendor.id,
      image_seed || slug,
      image_urls || null,
      supplier_ref || null,
      weight_grams ?? 500,
      stock ?? 50
    );

  return NextResponse.json({ id: info.lastInsertRowid, slug });
}
