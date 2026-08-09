"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

const STATUS_COLORS = {
  pending: "#E8A33D",
  confirmed: "#0F7A4B",
  shipped: "#2563EB",
  delivered: "#0B5C39",
  cancelled: "#DD4B2E",
};

export default function AccountPage() {
  const { t, lang } = useLang();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []));
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("myOrders")}</h1>

      {orders === null ? (
        <p style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="mb-4" style={{ color: "var(--color-ink-soft)" }}>{t("noOrders")}</p>
          <Link href="/products" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/account/orders/${o.id}`}
              className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-shadow"
              style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
            >
              <div>
                <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {t("orderNumber")} #{o.id}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>
                  {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}
                </div>
              </div>
              <div className="text-end">
                <div className="font-mono text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {formatPrice(o.total, lang)}
                </div>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full text-white inline-block mt-1"
                  style={{ background: STATUS_COLORS[o.status] || "#999" }}
                >
                  {t(o.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
