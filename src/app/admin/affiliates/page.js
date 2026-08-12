"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

const BADGE = { pending: "#E8A33D", approved: "#0F7A4B", rejected: "#DD4B2E", suspended: "#DD4B2E" };

export default function AdminAffiliatesPage() {
  const { t, lang } = useLang();
  const [rows, setRows] = useState(null);

  const load = () => fetch("/api/admin/affiliates").then((r) => (r.ok ? r.json() : { affiliates: [] })).then((d) => setRows(d.affiliates || []));
  useEffect(load, []);

  const patch = async (id, body) => {
    await fetch(`/api/admin/affiliates/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    load();
  };

  const box = { background: "var(--color-paper)", borderColor: "var(--color-line)" };

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("manageAffiliates")}</h1>
      {rows === null ? <p>…</p> : rows.length === 0 ? (
        <p style={{ color: "var(--color-ink-soft)" }}>{t("noAffiliates")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {rows.map((a) => (
            <div key={a.id} className="rounded-xl border p-4 flex flex-wrap items-center gap-3" style={box}>
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold" style={{ color: "var(--color-ink)" }}>
                  {a.user_name} · <span className="font-mono">{a.code}</span>
                </div>
                <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                  {a.user_email} {a.phone ? `· ${a.phone}` : ""}
                </div>
                {a.audience && <div className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>{a.audience}</div>}
                <div className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>
                  {t("clicks")}: {a.clicks} · {t("payoutMethod")}: {a.payout_method || "—"} {a.payout_details ? `(${a.payout_details})` : ""}
                </div>
              </div>

              <div className="text-end shrink-0">
                <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("owed")}</div>
                <div className="font-mono font-bold" style={{ color: "var(--color-accent-dark, #B93A22)" }}>{formatPrice(a.owed, lang)}</div>
                {a.paid > 0 && <div className="text-[11px]" style={{ color: "var(--color-ink-soft)" }}>{t("totalPaid")}: {formatPrice(a.paid, lang)}</div>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <input
                  type="number" min="0" max="50" step="1"
                  defaultValue={Math.round(a.commission_rate * 100)}
                  onBlur={(e) => {
                    const pct = parseFloat(e.target.value);
                    if (Number.isFinite(pct)) patch(a.id, { commission_rate: pct / 100 });
                  }}
                  className="w-16 rounded-lg px-2 py-1.5 border text-xs" style={box}
                />
                <span className="text-xs">%</span>
              </div>

              <span className="text-xs font-semibold px-2 py-1 rounded-full text-white shrink-0" style={{ background: BADGE[a.status] || "#999" }}>
                {t(a.status)}
              </span>

              <div className="flex gap-1.5 shrink-0">
                {a.status !== "approved" && (
                  <button onClick={() => patch(a.id, { status: "approved" })} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "var(--color-brand)" }}>
                    {t("approve")}
                  </button>
                )}
                {a.status === "approved" && (
                  <button onClick={() => patch(a.id, { status: "suspended" })} className="text-xs font-semibold px-3 py-1.5 rounded-lg border" style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}>
                    {t("reject")}
                  </button>
                )}
                {a.owed > 0 && (
                  <button
                    onClick={() => { if (confirm(t("confirmMarkPaid"))) patch(a.id, { markPaid: true }); }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    {t("markPaid")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
