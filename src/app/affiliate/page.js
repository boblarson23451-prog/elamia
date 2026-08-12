"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/i18n";

const BADGE = {
  pending: "#E8A33D", approved: "#0F7A4B", paid: "#0B5C39",
  rejected: "#DD4B2E", suspended: "#DD4B2E", cancelled: "#9CA3AF",
};

export default function AffiliatePage() {
  const { t, lang } = useLang();
  const { user, loading } = useCart();
  const [data, setData] = useState(undefined);
  const [form, setForm] = useState({ phone: "", audience: "", payout_method: "", payout_details: "" });
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => { setOrigin(window.location.origin); }, []);
  const load = () => fetch("/api/affiliate/me").then((r) => r.json()).then(setData).catch(() => setData({ affiliate: null }));
  useEffect(() => { load(); }, []);

  const apply = async (e) => {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/affiliate/apply", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    setBusy(false);
    load();
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1500);
  };

  if (loading || data === undefined) return <div className="max-w-3xl mx-auto px-4 py-16 text-center">…</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-3" style={{ color: "var(--color-ink)" }}>{t("affiliateProgram")}</h1>
        <p className="text-sm mb-5" style={{ color: "var(--color-ink-soft)" }}>{t("affiliateIntro")}</p>
        <Link href="/login" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("login")}
        </Link>
      </div>
    );
  }

  const aff = data.affiliate;
  const box = { background: "var(--color-paper)", borderColor: "var(--color-line)" };

  // --- Not yet an affiliate: application form ---
  if (!aff) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          {t("affiliateProgram")}
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>{t("affiliateIntro")}</p>
        <form onSubmit={apply} className="flex flex-col gap-3">
          <input className="rounded-lg px-3 py-2.5 border text-sm" style={box} placeholder={t("phone")}
            value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <textarea className="rounded-lg px-3 py-2.5 border text-sm" style={box} rows={3} placeholder={t("affiliateAudience")}
            value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
          <select className="rounded-lg px-3 py-2.5 border text-sm" style={box}
            value={form.payout_method} onChange={(e) => setForm({ ...form, payout_method: e.target.value })}>
            <option value="">{t("payoutMethod")}</option>
            <option value="ccp">CCP</option>
            <option value="baridimob">BaridiMob</option>
            <option value="cash">{t("payoutCash")}</option>
          </select>
          <input className="rounded-lg px-3 py-2.5 border text-sm" style={box} placeholder={t("payoutDetails")}
            value={form.payout_details} onChange={(e) => setForm({ ...form, payout_details: e.target.value })} />
          <button type="submit" disabled={busy} className="rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-60" style={{ background: "var(--color-accent)" }}>
            {busy ? "…" : t("affiliateApply")}
          </button>
        </form>
      </div>
    );
  }

  // --- Pending / rejected ---
  if (aff.status !== "approved") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-3" style={{ color: "var(--color-ink)" }}>{t("affiliateProgram")}</h1>
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white mb-3" style={{ background: BADGE[aff.status] }}>
          {t(aff.status)}
        </span>
        <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>
          {aff.status === "pending" ? t("affiliatePending") : t("affiliateRejected")}
        </p>
      </div>
    );
  }

  // --- Approved dashboard ---
  const s = data.stats || {};
  const link = `${origin}/r/${aff.code}`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ink)" }}>{t("affiliateDashboard")}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
        {t("yourRate")}: <strong>{Math.round(aff.commission_rate * 100)}%</strong> · {t("attributionNote").replace("{days}", 30)}
      </p>

      <div className="rounded-xl border p-4 mb-6" style={box}>
        <div className="text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("yourLink")}</div>
        <div className="flex gap-2 items-center flex-wrap">
          <code className="text-sm font-mono flex-1 min-w-[200px] break-all">{link}</code>
          <button onClick={() => copy(link, "l")} className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white shrink-0" style={{ background: "var(--color-accent)" }}>
            {copied === "l" ? "✓" : t("copy")}
          </button>
        </div>
        <div className="text-xs mt-3" style={{ color: "var(--color-ink-soft)" }}>
          {t("yourCode")}: <strong className="font-mono">{aff.code}</strong> · {t("linkAnyPage")}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { k: "clicks", v: s.clicks ?? 0, money: false },
          { k: "affOrders", v: s.orders ?? 0, money: false },
          { k: "pendingEarnings", v: s.pending ?? 0, money: true },
          { k: "availableEarnings", v: s.approved ?? 0, money: true },
        ].map(({ k, v, money }) => (
          <div key={k} className="rounded-xl border p-4" style={box}>
            <div className="text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>{t(k)}</div>
            <div className="text-lg font-bold font-mono" style={{ color: money ? "var(--color-accent-dark, #B93A22)" : "var(--color-ink)" }}>
              {money ? formatPrice(v, lang) : v}
            </div>
          </div>
        ))}
      </div>

      {s.paid > 0 && (
        <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
          {t("totalPaid")}: <strong>{formatPrice(s.paid, lang)}</strong>
        </p>
      )}

      <h2 className="font-semibold text-sm mb-2" style={{ color: "var(--color-ink)" }}>{t("commissionHistory")}</h2>
      {(!data.commissions || data.commissions.length === 0) ? (
        <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>{t("noCommissions")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--color-line)", color: "var(--color-ink-soft)" }}>
                <th className="text-start py-2 pe-3">{t("orderNumber")}</th>
                <th className="text-start py-2 pe-3">{t("date")}</th>
                <th className="text-start py-2 pe-3">{t("total")}</th>
                <th className="text-start py-2 pe-3">{t("commission")}</th>
                <th className="text-start py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {data.commissions.map((c) => (
                <tr key={c.id} className="border-b" style={{ borderColor: "var(--color-line)" }}>
                  <td className="py-2 pe-3 font-mono">#{c.order_id}</td>
                  <td className="py-2 pe-3 text-xs">{new Date(c.order_date).toLocaleDateString(lang === "ar" ? "ar-DZ" : "fr-DZ")}</td>
                  <td className="py-2 pe-3 font-mono">{formatPrice(c.order_subtotal, lang)}</td>
                  <td className="py-2 pe-3 font-mono font-semibold">{formatPrice(c.amount, lang)}</td>
                  <td className="py-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: BADGE[c.status] || "#999" }}>
                      {t(c.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs mt-4" style={{ color: "var(--color-ink-soft)" }}>{t("commissionRule")}</p>
    </div>
  );
}
