import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req, { params }) {
  const { slug } = await params;
  const product = db
    .prepare(
      `SELECT p.*, c.slug as category_slug, c.name_ar as category_name_ar, c.name_fr as category_name_fr
       FROM products p JOIN categories c ON c.id = p.category_id
       WHERE p.slug = ? AND p.is_active = 1`
    )
    .get(slug);

  if (!product) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const related = db
    .prepare(
      `SELECT p.* FROM products p WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1 LIMIT 4`
    )
    .all(product.category_id, product.id);

  return NextResponse.json({ product, related });
}
