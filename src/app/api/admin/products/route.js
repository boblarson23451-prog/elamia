import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || `produit-${Date.now()}`;
}

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const products = db
    .prepare(
      `SELECT p.*, c.name_ar as category_name_ar, c.name_fr as category_name_fr,
              v.store_name as vendor_store_name
       FROM products p JOIN categories c ON c.id = p.category_id
       LEFT JOIN vendors v ON v.id = p.vendor_id
       ORDER BY p.created_at DESC`
    )
    .all();

  return NextResponse.json({ products });
}

export async function POST(req) {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const body = await req.json();
  const { name_ar, name_fr, description_ar, description_fr, price, compare_at_price, category_id, image_seed, stock, weight_grams, image_urls, supplier_ref } = body;

  if (!name_ar || !name_fr || !price || !category_id) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  let slug = slugify(name_fr);
  const existsSlug = db.prepare("SELECT id FROM products WHERE slug = ?").get(slug);
  if (existsSlug) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const info = db
    .prepare(
      `INSERT INTO products (slug, name_ar, name_fr, description_ar, description_fr, price, compare_at_price, category_id, image_seed, image_urls, supplier_ref, weight_grams, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      image_seed || slug,
      image_urls || null,
      supplier_ref || null,
      weight_grams ?? 500,
      stock ?? 50
    );

  return NextResponse.json({ id: info.lastInsertRowid, slug });
}
