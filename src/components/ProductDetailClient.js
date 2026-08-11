"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import ProductImage, { parseImageUrls } from "./ProductImage";
import { PriceTicket, DiscountStamp } from "./PriceTicket";
import VariantSelector from "./VariantSelector";

export default function ProductDetailClient({ product, variants = [] }) {
  const { t, field } = useLang();
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const gallery = parseImageUrls(product.image_urls);
  const [activeImg, setActiveImg] = useState(0);
  const [status, setStatus] = useState("idle");
  const [variant, setVariant] = useState(null);
  const [variantError, setVariantError] = useState("");

  const hasVariants = variants.length > 0;
  // A variant's price/stock override the product's when one is selected.
  // With variants but none chosen yet, show the combined stock so the page
  // doesn't read "out of stock" before the shopper picks a size.
  const effPrice = variant?.price ?? product.price;
  const effStock = hasVariants
    ? (variant ? variant.stock : variants.reduce((s, v) => s + v.stock, 0))
    : product.stock;

  const name = field(product, "name");
  const description = field(product, "description");
  const inStock = effStock > 0;

  const handleAdd = async (buyNow = false) => {
    setVariantError("");
    if (hasVariants && !variant) {
      setVariantError(t("selectVariantFirst"));
      return;
    }
    setStatus("loading");
    const res = await addToCart(product.id, qty, variant?.id ?? null);
    if (res.needsAuth) {
      router.push("/login");
      return;
    }
    setStatus("added");
    if (buyNow) router.push("/cart");
    else setTimeout(() => setStatus("idle"), 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-xs mb-4 flex gap-1.5 flex-wrap" style={{ color: "var(--color-ink-soft)" }}>
        <Link href="/" className="hover:underline">{t("home")}</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category_slug}`} className="hover:underline">
          {field({ name_ar: product.category_name_ar, name_fr: product.category_name_fr }, "name")}
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="relative rounded-xl overflow-hidden aspect-square" style={{ background: "var(--color-paper)" }}>
            <ProductImage
              seed={product.image_seed}
              urls={variant?.image_url || (gallery.length ? gallery[activeImg] : null)}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 start-3">
              <DiscountStamp price={product.price} comparePrice={product.compare_at_price} />
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {gallery.slice(0, 8).map((u, i) => (
                <button
                  key={u + i}
                  onClick={() => setActiveImg(i)}
                  className="shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: i === activeImg ? "var(--color-accent)" : "var(--color-line)" }}
                  aria-label={`Image ${i + 1}`}
                >
                  <ProductImage seed={product.image_seed} urls={u} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--color-ink)", fontFamily: "var(--font-display)" }}>
            {name}
          </h1>
          <div className="flex items-center gap-3 text-sm mb-4" style={{ color: "var(--color-ink-soft)" }}>
            <span>⭐ {product.rating?.toFixed(1)} ({t("reviews")})</span>
            <span>·</span>
            <span>{product.sold_count} {t("sold")}</span>
          </div>

          <div className="text-sm mb-4" style={{ color: "var(--color-brand)" }}>
            🏪 {t("soldBy")}: <span className="font-semibold">{product.vendor_store_name || t("officialStore")}</span>
          </div>

          <PriceTicket price={effPrice} comparePrice={product.compare_at_price} size="lg" />

          <VariantSelector
            product={product}
            variants={variants}
            selected={variant}
            onSelect={(v) => { setVariant(v); setQty(1); }}
          />
          {variantError && (
            <p className="text-sm mt-2" style={{ color: "var(--color-accent)" }}>{variantError}</p>
          )}

          <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
            {description}
          </p>

          <div className="mt-3 text-sm">
            {inStock ? (
              <span style={{ color: "var(--color-brand)" }}>✓ {t("stock")}: {effStock}</span>
            ) : (
              <span style={{ color: "var(--color-accent)" }}>{t("outOfStock")}</span>
            )}
          </div>

          {inStock && (
            <div className="mt-5 flex items-center gap-3">
              <div className="flex items-center border rounded-lg" style={{ borderColor: "var(--color-line)" }}>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-lg"
                  style={{ color: "var(--color-ink)" }}
                >
                  −
                </button>
                <span className="px-4 font-mono">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(effStock, q + 1))}
                  className="px-3 py-2 text-lg"
                  style={{ color: "var(--color-ink)" }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <button
              disabled={!inStock || status === "loading"}
              onClick={() => handleAdd(false)}
              className="flex-1 rounded-lg py-3 font-semibold text-sm border-2 transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
            >
              {status === "added" ? "✓" : t("addToCart")}
            </button>
            <button
              disabled={!inStock || status === "loading"}
              onClick={() => handleAdd(true)}
              className="flex-1 rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-50"
              style={{ background: "var(--color-accent)" }}
            >
              {t("buyNow")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
