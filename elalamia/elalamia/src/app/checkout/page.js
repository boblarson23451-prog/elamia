"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { WILAYAS, formatPrice } from "@/lib/i18n";

export default function CheckoutPage() {
  const { t, lang } = useLang();
  const { items, subtotal, user, loading, clearAfterOrder } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    wilaya: user?.wilaya || "",
    address: "",
    paymentMethod: "cod",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, fullName: f.fullName || user.name, phone: f.phone || user.phone || "", wilaya: f.wilaya || user.wilaya || "" }));
    }
  }, [user]);

  if (!user) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-center">...</div>;
  }
  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <p style={{ color: "var(--color-ink-soft)" }}>{t("emptyCart")}</p>
      </div>
    );
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.fullName || !form.phone || !form.wilaya || !form.address) {
      setError(t("fillAllFields"));
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      clearAfterOrder();
      router.push(`/account/orders/${data.orderId}?success=1`);
    } else {
      setError(t("fillAllFields"));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("checkoutTitle")}</h1>

      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={submit} className="md:col-span-2 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t("fullName")}</label>
            <input
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 border text-sm"
              style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("phone")}</label>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="05XX XX XX XX"
              className="w-full rounded-lg px-3 py-2.5 border text-sm"
              style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
            />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("wilaya")}</label>
            <select
              value={form.wilaya}
              onChange={(e) => update("wilaya", e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 border text-sm"
              style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
            >
              <option value="">—</option>
              {WILAYAS.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("address")}</label>
            <textarea
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 border text-sm"
              style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">{t("paymentMethod")}</label>
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer"
                style={{ borderColor: "var(--color-brand)", background: "var(--color-paper)" }}
              >
                <input type="radio" checked readOnly name="pm" />
                {t("cod")}
              </label>
              <label
                className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm opacity-50"
                style={{ borderColor: "var(--color-line)" }}
              >
                <input type="radio" disabled name="pm" />
                {t("cardSoon")}
              </label>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-60"
            style={{ background: "var(--color-accent)" }}
          >
            {submitting ? "..." : t("placeOrder")}
          </button>
        </form>

        <div
          className="h-fit rounded-xl border p-5"
          style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
        >
          <h3 className="font-semibold text-sm mb-3">{t("cart")} ({items.length})</h3>
          <div className="flex flex-col gap-2 mb-4 max-h-64 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-xs" style={{ color: "var(--color-ink-soft)" }}>
                <span className="line-clamp-1">{i.quantity}× {lang === "ar" ? i.name_ar : i.name_fr}</span>
                <span className="font-mono shrink-0">{formatPrice(i.price * i.quantity, lang)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-base pt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
            <span>{t("total")}</span>
            <span className="font-mono">{formatPrice(subtotal, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
