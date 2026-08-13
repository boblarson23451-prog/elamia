import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;
  const body = await req.json();
  const fields = ["name_fr", "name_ar", "icon", "sort_order"];
  const sets = [], vals = [];
  for (const f of fields) if (body[f] !== undefined) { sets.push(`${f} = ?`); vals.push(body[f]); }
  if (!sets.length) return NextResponse.json({ error: "no_fields" }, { status: 400 });
  vals.push(id);
  db.prepare(`UPDATE categories SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;

  // Refuse to delete a category that still holds products — otherwise those
  // products would point at a category that no longer exists and vanish from
  // the storefront. Move them first.
  const { c } = db.prepare("SELECT COUNT(*) c FROM products WHERE category_id = ?").get(id);
  if (c > 0) {
    return NextResponse.json({ error: "category_not_empty", productCount: c }, { status: 400 });
  }
  const { total } = db.prepare("SELECT COUNT(*) total FROM categories").get();
  if (total <= 1) return NextResponse.json({ error: "last_category" }, { status: 400 });

  db.prepare("DELETE FROM categories WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
