"use client";

// Catalogue reflects live stock/prices — never prerender it.

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import ProductGrid from "@/components/ProductGrid";

function ProductsContent() {
  const { t, field } = useLang();
  const searchParams = useSearchParams();
  const router = useRouter();

  const category = searchParams.get("category") || "";
  const q = searchParams.get("q") || "";
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [category, q, sort]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <aside className="md:w-56 shrink-0">
          <h3 className="font-semibold mb-2 text-sm" style={{ color: "var(--color-ink)" }}>
            {t("categories")}
          </h3>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            <button
              onClick={() => updateParam("category", "")}
              className={`text-start text-sm px-3 py-1.5 rounded-lg whitespace-nowrap ${!category ? "font-bold" : ""}`}
              style={{
                background: !category ? "var(--color-brand)" : "var(--color-paper)",
                color: !category ? "#fff" : "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
            >
              {t("allProducts")}
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam("category", c.slug)}
                className={`text-start text-sm px-3 py-1.5 rounded-lg whitespace-nowrap flex items-center gap-1.5 ${
                  category === c.slug ? "font-bold" : ""
                }`}
                style={{
                  background: category === c.slug ? "var(--color-brand)" : "var(--color-paper)",
                  color: category === c.slug ? "#fff" : "var(--color-ink)",
                  border: "1px solid var(--color-line)",
                }}
              >
                <span>{c.icon}</span> {field(c, "name")}
              </button>
            ))}
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
            <h1 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
              {q ? `${t("search")}: "${q}"` : t("allProducts")}
            </h1>
            <select
              value={sort}
              onChange={(e) => updateParam("sort", e.target.value)}
              className="text-sm rounded-lg px-3 py-2 border"
              style={{ borderColor: "var(--color-line)", background: "var(--color-paper)", color: "var(--color-ink)" }}
            >
              <option value="newest">{t("newest")}</option>
              <option value="price_asc">{t("priceLowHigh")}</option>
              <option value="price_desc">{t("priceHighLow")}</option>
              <option value="best_selling">{t("bestSelling")}</option>
            </select>
          </div>

          {loading ? (
            <p style={{ color: "var(--color-ink-soft)" }}>...</p>
          ) : products.length === 0 ? (
            <p style={{ color: "var(--color-ink-soft)" }}>{t("noProducts")}</p>
          ) : (
            <ProductGrid products={products} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsContent />
    </Suspense>
  );
}
