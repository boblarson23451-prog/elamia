import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateVariant, requiresVariant } from "@/lib/variants";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ items: [] }, { status: 401 });

  const items = db
    .prepare(
      `SELECT ci.id, ci.quantity, ci.variant_id, p.id as product_id, p.slug, p.name_ar, p.name_fr,
              COALESCE(v.price, p.price) as price, p.compare_at_price,
              p.image_seed, p.image_urls,
              COALESCE(v.stock, p.stock) as stock,
              COALESCE(v.weight_grams, p.weight_grams) as weight_grams,
              v.v1_fr, v.v1_ar, v.v2_fr, v.v2_ar, v.image_url as variant_image
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = ?
       ORDER BY ci.created_at DESC`
    )
    .all(user.id);

  return NextResponse.json({ items });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { productId, quantity = 1, variantId = null } = await req.json();
  const product = db.prepare("SELECT * FROM products WHERE id = ? AND is_active = 1").get(productId);
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // If a product has variants, one must be chosen — otherwise we'd sell an
  // item without knowing which size/colour to ship.
  if (!variantId && requiresVariant(productId)) {
    return NextResponse.json({ error: "variant_required" }, { status: 400 });
  }
  const check = validateVariant(productId, variantId);
  if (!check.ok) return NextResponse.json({ error: check.error }, { status: 400 });

  const availableStock = check.variant ? check.variant.stock : product.stock;
  if (availableStock <= 0) {
    return NextResponse.json({ error: "out_of_stock" }, { status: 400 });
  }

  const existing = db
    .prepare(
      "SELECT * FROM cart_items WHERE user_id = ? AND product_id = ? AND COALESCE(variant_id,0) = COALESCE(?,0)"
    )
    .get(user.id, productId, variantId);

  if (existing) {
    const newQty = Math.min(existing.quantity + quantity, availableStock);
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(newQty, existing.id);
  } else {
    db.prepare("INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES (?, ?, ?, ?)").run(
      user.id,
      productId,
      variantId,
      Math.min(quantity, availableStock)
    );
  }

  return NextResponse.json({ ok: true });
}
