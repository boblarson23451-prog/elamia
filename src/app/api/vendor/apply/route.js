import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

function slugify(text) {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || `boutique-${Date.now()}`
  );
}

export async function POST(req) {
  let user;
  try {
    user = await requireUser();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const existing = db.prepare("SELECT * FROM vendors WHERE user_id = ?").get(user.id);
  if (existing) {
    return NextResponse.json({ error: "already_applied", vendor: existing }, { status: 409 });
  }

  const { storeName, description, wilaya, phone } = await req.json();
  if (!storeName) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  let slug = slugify(storeName);
  const slugTaken = db.prepare("SELECT id FROM vendors WHERE store_slug = ?").get(slug);
  if (slugTaken) slug = `${slug}-${Date.now().toString().slice(-5)}`;

  const info = db
    .prepare(
      `INSERT INTO vendors (user_id, store_name, store_slug, description, wilaya, phone, logo_seed, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .run(user.id, storeName, slug, description || "", wilaya || null, phone || null, slug);

  const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(info.lastInsertRowid);

  return NextResponse.json({ vendor });
}
