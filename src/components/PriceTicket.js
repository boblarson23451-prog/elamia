"use client";

import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

export function PriceTicket({ price, comparePrice, size = "md" }) {
  const { lang } = useLang();
  const big = size === "lg";
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span
        className={`price-ticket text-accent-dark ${big ? "text-xl md:text-2xl" : "text-base"}`}
        style={{ color: "var(--color-accent-dark)" }}
      >
        {formatPrice(price, lang)}
      </span>
      {comparePrice && comparePrice > price && (
        <span
          className="line-through opacity-50 font-mono"
          style={{ color: "var(--color-ink-soft)" }}
        >
          {formatPrice(comparePrice, lang)}
        </span>
      )}
    </div>
  );
}

export function DiscountStamp({ price, comparePrice }) {
  if (!comparePrice || comparePrice <= price) return null;
  const pct = Math.round(((comparePrice - price) / comparePrice) * 100);
  return (
    <span className="stamp-badge inline-flex items-center justify-center text-xs px-2 py-1">
      -{pct}%
    </span>
  );
}
