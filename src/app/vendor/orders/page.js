"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

export default function VendorOrdersPage() {
  const { t, lang } = useLang();
  const [items, setItems] = useState(null);

  useEffect(() => {
    fetch("/api/vendor/orders")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("vendorOrders")}</h1>

      {items === null ? (
        <p style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{t("noOrders")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start border-b" style={{ borderColor: "var(--color-line)", color: "var(--color-ink-soft)" }}>
                <th className="text-start py-2 pe-4">{t("orderNumber")}</th>
                <th className="text-start py-2 pe-4">Produit</th>
                <th className="text-start py-2 pe-4">{t("customer")}</th>
                <th className="text-start py-2 pe-4">{t("wilaya")}</th>
                <th className="text-start py-2 pe-4">{t("total")}</th>
                <th className="text-start py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.item_id} className="border-b" style={{ borderColor: "var(--color-line)" }}>
                  <td className="py-2 pe-4 font-mono">#{it.order_id}</td>
                  <td className="py-2 pe-4">
                    {it.quantity}× {lang === "ar" ? it.name_ar : it.name_fr}
                  </td>
                  <td className="py-2 pe-4">
                    <div>{it.full_name}</div>
                    <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{it.phone}</div>
                  </td>
                  <td className="py-2 pe-4">{it.wilaya}</td>
                  <td className="py-2 pe-4 font-mono">{formatPrice(it.price * it.quantity, lang)}</td>
                  <td className="py-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: "var(--color-brand)" }}>
                      {t(it.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
