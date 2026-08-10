"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

const STATUS_COLORS = {
  pending: "#E8A33D",
  approved: "#0F7A4B",
  rejected: "#DD4B2E",
  suspended: "#DD4B2E",
};

export default function AdminVendorsPage() {
  const { t, lang } = useLang();
  const [vendors, setVendors] = useState(null);

  const load = () => {
    fetch("/api/admin/vendors")
      .then((r) => (r.ok ? r.json() : { vendors: [] }))
      .then((d) => setVendors(d.vendors || []));
  };

  useEffect(load, []);

  const setStatus = async (id, status) => {
    await fetch(`/api/admin/vendors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("manageVendors")}</h1>

      {vendors === null ? (
        <p style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : vendors.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{t("noApplications")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-3 p-4 rounded-xl border flex-wrap"
              style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
            >
              <div className="flex-1 min-w-[180px]">
                <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>🏪 {v.store_name}</div>
                <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  {v.user_name} · {v.user_email} · {v.wilaya || "—"}
                </div>
                {v.description && (
                  <div className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>{v.description}</div>
                )}
              </div>
              <span
                className="text-xs font-semibold px-2 py-1 rounded-full text-white shrink-0"
                style={{ background: STATUS_COLORS[v.status] || "#999" }}
              >
                {t(v.status)}
              </span>
              {v.status !== "approved" && (
                <button
                  onClick={() => setStatus(v.id, "approved")}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0"
                  style={{ background: "var(--color-brand)" }}
                >
                  {t("approve")}
                </button>
              )}
              {v.status !== "rejected" && v.status !== "suspended" && (
                <button
                  onClick={() => setStatus(v.id, v.status === "approved" ? "suspended" : "rejected")}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border shrink-0"
                  style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
                >
                  {t("reject")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
