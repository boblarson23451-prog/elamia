import { db } from "./db";

/** Loads active variants for a product, ordered for display. */
export function getVariants(productId) {
  return db
    .prepare(
      `SELECT * FROM product_variants
       WHERE product_id = ? AND is_active = 1
       ORDER BY position ASC, id ASC`
    )
    .all(productId);
}

/** Human-readable variant label, e.g. "Rouge / M". */
export function variantLabel(variant, lang = "fr") {
  if (!variant) return null;
  const v1 = lang === "ar" ? variant.v1_ar || variant.v1_fr : variant.v1_fr || variant.v1_ar;
  const v2 = lang === "ar" ? variant.v2_ar || variant.v2_fr : variant.v2_fr || variant.v2_ar;
  return [v1, v2].filter(Boolean).join(" / ") || null;
}

/**
 * Resolves the effective price/stock/weight for a line item.
 * Variant values override the product's when set, so a large size can cost
 * more or weigh more without duplicating the whole product.
 */
export function effectiveLine(product, variant) {
  return {
    price: variant?.price ?? product.price,
    stock: variant ? variant.stock : product.stock,
    weight_grams: variant?.weight_grams ?? product.weight_grams,
  };
}

/** Validates that a variant belongs to the product and is purchasable. */
export function validateVariant(productId, variantId) {
  if (!variantId) return { ok: true, variant: null };
  const v = db
    .prepare("SELECT * FROM product_variants WHERE id = ? AND product_id = ? AND is_active = 1")
    .get(variantId, productId);
  if (!v) return { ok: false, error: "invalid_variant" };
  return { ok: true, variant: v };
}

/** True when a product requires the buyer to choose a variant. */
export function requiresVariant(productId) {
  const { c } = db
    .prepare("SELECT COUNT(*) c FROM product_variants WHERE product_id = ? AND is_active = 1")
    .get(productId);
  return c > 0;
}

/** Replaces a product's variant set (admin/vendor editing). */
export function replaceVariants(productId, variants) {
  const del = db.prepare("DELETE FROM product_variants WHERE product_id = ?");
  const ins = db.prepare(
    `INSERT INTO product_variants
       (product_id, v1_fr, v1_ar, v2_fr, v2_ar, sku, price, stock, weight_grams, image_url, swatch, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  db.transaction(() => {
    del.run(productId);
    (variants || []).forEach((v, i) => {
      ins.run(
        productId,
        v.v1_fr || null, v.v1_ar || null,
        v.v2_fr || null, v.v2_ar || null,
        v.sku || null,
        v.price === "" || v.price == null ? null : parseInt(v.price, 10),
        parseInt(v.stock, 10) || 0,
        v.weight_grams === "" || v.weight_grams == null ? null : parseInt(v.weight_grams, 10),
        v.image_url || null,
        v.swatch || null,
        i
      );
    });
  })();
}
