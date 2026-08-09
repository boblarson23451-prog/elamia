import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const items = db
    .prepare(
      `SELECT ci.id, ci.quantity, p.id as product_id, p.slug, p.name_ar, p.name_fr,
              p.price, p.compare_at_price, p.image_seed, p.stock
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`
    )
    .all(user.id);

  return NextResponse.json({ items });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { productId, quantity = 1 } = await req.json();
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").get(productId);
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const existing = db
    .prepare("SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?")
    .get(user.id, productId);

  if (existing) {
    db.prepare("UPDATE cart_items SET quantity = quantity + ? WHERE id = ?").run(quantity, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)").run(
      user.id,
      productId,
      quantity
    );
  }

  return NextResponse.json({ ok: true });
}
