"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

export default function VendorDashboard() {
  const { t, lang } = useLang();
  const [stats, setStats] = useState(null);
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    fetch("/api/vendor/orders").then((r) => (r.ok ? r.json() : { stats: null })).then((d) => setStats(d.stats));
    fetch("/api/vendor/products").then((r) => (r.ok ? r.json() : { products: [] })).then((d) => setProductCount((d.products || []).length));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("vendorDashboard")}</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border p-5" style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("totalOrders")}</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--color-ink)" }}>{stats?.totalOrders ?? "…"}</div>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("totalProducts")}</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--color-ink)" }}>{productCount ?? "…"}</div>
        </div>
        <div className="rounded-xl border p-5" style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}>
          <div className="text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("totalRevenue")}</div>
          <div className="text-2xl font-bold font-mono" style={{ color: "var(--color-accent-dark, #B93A22)" }}>
            {stats ? formatPrice(stats.totalRevenue, lang) : "…"}
          </div>
        </div>
      </div>
    </div>
  );
}
