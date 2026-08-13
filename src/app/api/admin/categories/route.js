import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { slugify } from "@/lib/slug";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const categories = db.prepare(
    `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) as product_count
     FROM categories c ORDER BY c.sort_order ASC, c.id ASC`
  ).all();
  return NextResponse.json({ categories });
}

export async function POST(req) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { name_fr, name_ar, icon, sort_order } = await req.json();
  if (!name_fr || !name_ar) return NextResponse.json({ error: "missing_fields" }, { status: 400 });

  let slug = slugify(name_fr, "categorie");
  for (let i = 2; db.prepare("SELECT id FROM categories WHERE slug = ?").get(slug); i++) {
    slug = `${slugify(name_fr, "categorie")}-${i}`;
  }
  const info = db.prepare(
    "INSERT INTO categories (slug, name_fr, name_ar, icon, sort_order) VALUES (?, ?, ?, ?, ?)"
  ).run(slug, name_fr, name_ar, icon || "🛍️", Number(sort_order) || 0);

  return NextResponse.json({ id: info.lastInsertRowid, slug });
}
