import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort") || "newest";
  const limit = parseInt(searchParams.get("limit") || "60", 10);
  const deals = searchParams.get("deals");

  let sql = `
    SELECT p.*, c.slug as category_slug, c.name_ar as category_name_ar, c.name_fr as category_name_fr,
           v.store_name as vendor_store_name, v.store_slug as vendor_store_slug
    FROM products p
    JOIN categories c ON c.id = p.category_id
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE p.is_active = 1
  `;
  const params = [];

  if (category) {
    sql += " AND c.slug = ?";
    params.push(category);
  }
  if (q) {
    sql += " AND (p.name_ar LIKE ? OR p.name_fr LIKE ?)";
    params.push(`%${q}%`, `%${q}%`);
  }
  if (deals) {
    sql += " AND p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price";
  }

  const sortMap = {
    newest: "p.created_at DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    best_selling: "p.sold_count DESC",
  };
  sql += ` ORDER BY ${sortMap[sort] || sortMap.newest} LIMIT ?`;
  params.push(limit);

  const products = db.prepare(sql).all(...params);
  return NextResponse.json({ products });
}
