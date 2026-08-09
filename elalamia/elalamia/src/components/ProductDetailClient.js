"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import ProductImage from "./ProductImage";
import { PriceTicket, DiscountStamp } from "./PriceTicket";

export default function ProductDetailClient({ product }) {
  const { t, field } = useLang();
  const { addToCart } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [status, setStatus] = useState("idle");

  const name = field(product, "name");
  const description = field(product, "description");
  const inStock = product.stock > 0;

  const handleAdd = async (buyNow = false) => {
    setStatus("loading");
    const res = await addToCart(product.id, qty);
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
        <div className="relative rounded-xl overflow-hidden aspect-square" style={{ background: "var(--color-paper)" }}>
          <ProductImage seed={product.image_seed} alt={name} className="w-full h-full object-cover" />
          <div className="absolute top-3 start-3">
            <DiscountStamp price={product.price} comparePrice={product.compare_at_price} />
          </div>
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

          <PriceTicket price={product.price} comparePrice={product.compare_at_price} size="lg" />

          <p className="mt-5 text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
            {description}
          </p>

          <div className="mt-3 text-sm">
            {inStock ? (
              <span style={{ color: "var(--color-brand)" }}>✓ {t("stock")}: {product.stock}</span>
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
                  onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
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
