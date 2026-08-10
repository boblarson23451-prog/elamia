"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { WILAYAS } from "@/lib/i18n";

export default function SellPage() {
  const { t } = useLang();
  const { user, loading: userLoading } = useCart();
  const router = useRouter();

  const [vendor, setVendor] = useState(undefined); // undefined = loading, null = none
  const [form, setForm] = useState({ storeName: "", description: "", wilaya: "", phone: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => r.json())
      .then((d) => setVendor(d.vendor));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!user) {
      router.push("/login");
      return;
    }
    if (!form.storeName) {
      setError(t("fillAllFields"));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/vendor/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      setVendor(data.vendor);
    } else {
      setError(t("fillAllFields"));
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
          {t("sellOnElalamia")}
        </h1>
        <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>{t("sellSubtitle")}</p>
      </div>

      {vendor === undefined || userLoading ? (
        <p className="text-center" style={{ color: "var(--color-ink-soft)" }}>...</p>
      ) : vendor ? (
        <div
          className="rounded-xl border p-6 text-center"
          style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
        >
          <p className="font-semibold mb-2" style={{ color: "var(--color-ink)" }}>{vendor.store_name}</p>
          {vendor.status === "pending" && (
            <>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white mb-3" style={{ background: "var(--color-gold)" }}>
                {t("pending")}
              </span>
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>{t("applicationPendingNote")}</p>
            </>
          )}
          {vendor.status === "approved" && (
            <>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white mb-3" style={{ background: "var(--color-brand)" }}>
                {t("approved")}
              </span>
              <div>
                <a href="/vendor" className="inline-block mt-2 rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
                  {t("goToVendorDashboard")}
                </a>
              </div>
            </>
          )}
          {(vendor.status === "rejected" || vendor.status === "suspended") && (
            <>
              <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full text-white mb-3" style={{ background: "var(--color-accent)" }}>
                {t("rejected")}
              </span>
              <p className="text-sm" style={{ color: "var(--color-ink-soft)" }}>{t("applicationRejectedNote")}</p>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            required
            placeholder={t("storeName")}
            value={form.storeName}
            onChange={(e) => setForm((f) => ({ ...f, storeName: e.target.value }))}
            className="rounded-lg px-3 py-2.5 border text-sm"
            style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
          />
          <textarea
            placeholder={t("storeDescription")}
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded-lg px-3 py-2.5 border text-sm"
            style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
          />
          <select
            value={form.wilaya}
            onChange={(e) => setForm((f) => ({ ...f, wilaya: e.target.value }))}
            className="rounded-lg px-3 py-2.5 border text-sm"
            style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
          >
            <option value="">{t("wilaya")}</option>
            {WILAYAS.map((w) => (
              <option key={w} value={w}>{w}</option>
            ))}
          </select>
          <input
            placeholder={t("phone")}
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-lg px-3 py-2.5 border text-sm"
            style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
          />
          {error && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-60"
            style={{ background: "var(--color-accent)" }}
          >
            {submitting ? "..." : t("applyAsVendor")}
          </button>
        </form>
      )}
    </div>
  );
}
