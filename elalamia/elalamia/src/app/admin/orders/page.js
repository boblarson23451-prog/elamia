"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export default function AdminOrdersPage() {
  const { t, lang } = useLang();
  const [orders, setOrders] = useState(null);

  const load = () => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : { orders: [] }))
      .then((d) => setOrders(d.orders || []));
  };

  useEffect(load, []);

  const updateStatus = async (id, status) => {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("manageOrders")}</h1>

      {orders === null ? (
        <p style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : orders.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{t("noOrders")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-start border-b" style={{ borderColor: "var(--color-line)", color: "var(--color-ink-soft)" }}>
                <th className="text-start py-2 pe-4">{t("orderNumber")}</th>
                <th className="text-start py-2 pe-4">{t("customer")}</th>
                <th className="text-start py-2 pe-4">{t("wilaya")}</th>
                <th className="text-start py-2 pe-4">{t("total")}</th>
                <th className="text-start py-2 pe-4">{t("date")}</th>
                <th className="text-start py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b" style={{ borderColor: "var(--color-line)" }}>
                  <td className="py-2 pe-4 font-mono">#{o.id}</td>
                  <td className="py-2 pe-4">
                    <div>{o.customer_name}</div>
                    <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{o.phone}</div>
                  </td>
                  <td className="py-2 pe-4">{o.wilaya}</td>
                  <td className="py-2 pe-4 font-mono">{formatPrice(o.total, lang)}</td>
                  <td className="py-2 pe-4 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                    {new Date(o.created_at).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}
                  </td>
                  <td className="py-2">
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="rounded-lg px-2 py-1.5 border text-xs"
                      style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{t(s)}</option>
                      ))}
                    </select>
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
