"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

export default function VendorProductsPage() {
  const { t, lang, field } = useLang();
  const [products, setProducts] = useState(null);

  const load = () => {
    fetch("/api/vendor/products")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => setProducts(d.products || []));
  };

  useEffect(load, []);

  // Refetch when the tab regains focus, so returning from an edit screen or
  // another tab always shows current data rather than a stale snapshot.
  useEffect(() => {
    const onFocus = () => { if (document.visibilityState === "visible") load(); };
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const remove = async (id) => {
    if (!confirm(t("delete") + "?")) return;
    await fetch(`/api/vendor/products/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: "var(--color-ink)" }}>{t("vendorProducts")}</h1>
        <Link
          href="/vendor/products/new"
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: "var(--color-accent)" }}
        >
          + {t("addProduct")}
        </Link>
      </div>

      {products === null ? (
        <p style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : products.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{t("noProducts")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 p-3 rounded-xl border"
              style={{ background: "var(--color-paper)", borderColor: "var(--color-line)", opacity: p.is_active ? 1 : 0.5 }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate" style={{ color: "var(--color-ink)" }}>
                  {field(p, "name")}
                </div>
                <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  {field({ name_ar: p.category_name_ar, name_fr: p.category_name_fr }, "name")} · {t("stock")}: {p.stock}
                </div>
              </div>
              <div className="font-mono text-sm shrink-0">{formatPrice(p.price, lang)}</div>
              <Link href={`/vendor/products/${p.id}/edit`} className="text-xs font-semibold shrink-0" style={{ color: "var(--color-brand)" }}>
                {t("edit")}
              </Link>
              <button onClick={() => remove(p.id)} className="text-xs font-semibold shrink-0" style={{ color: "var(--color-accent)" }}>
                {t("delete")}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
