"use client";

import Link from "next/link";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import ProductImage from "./ProductImage";
import { PriceTicket, DiscountStamp } from "./PriceTicket";

export default function ProductCard({ product }) {
  const { lang, t, field } = useLang();
  const { addToCart } = useCart();
  const [status, setStatus] = useState("idle");

  const name = field(product, "name");

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus("loading");
    const res = await addToCart(product.id, 1);
    if (res.needsAuth) {
      window.location.href = "/login";
      return;
    }
    setStatus("added");
    setTimeout(() => setStatus("idle"), 1200);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col rounded-xl overflow-hidden border transition-shadow hover:shadow-lg"
      style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--color-cream)" }}>
        <ProductImage
          seed={product.image_seed}
          urls={product.image_urls}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 start-2">
          <DiscountStamp price={product.price} comparePrice={product.compare_at_price} />
        </div>
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem]" style={{ color: "var(--color-ink)" }}>
          {name}
        </h3>
        <PriceTicket price={product.price} comparePrice={product.compare_at_price} />
        <div className="text-[11px] truncate" style={{ color: "var(--color-brand)" }}>
          🏪 {product.vendor_store_name || t("officialStore")}
        </div>
        <div className="flex items-center justify-between text-xs" style={{ color: "var(--color-ink-soft)" }}>
          <span>⭐ {product.rating?.toFixed(1)}</span>
          <span>{product.sold_count} {t("sold")}</span>
        </div>
        <button
          onClick={handleAdd}
          disabled={status === "loading"}
          className="mt-1 w-full rounded-lg py-2 text-sm font-semibold text-white transition-colors"
          style={{ background: status === "added" ? "var(--color-brand)" : "var(--color-accent)" }}
        >
          {status === "added" ? "✓" : t("addToCart")}
        </button>
      </div>
    </Link>
  );
}
