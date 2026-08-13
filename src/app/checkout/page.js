"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { WILAYAS, formatPrice } from "@/lib/i18n";
import ProductImage from "@/components/ProductImage";
import CustomsNotice from "@/components/CustomsNotice";

export default function CheckoutPage() {
  const { t, lang } = useLang();
  const { items, subtotal, user, loading, clearAfterOrder } = useCart();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "", phone: "", wilaya: "", address: "",
    paymentMethod: "", deliveryType: "home", shippingCarrier: "", pickupPointId: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [gateways, setGateways] = useState({ chargily: false, sofizpay: false, cod: false });
  const [shipping, setShipping] = useState(null);
  const [customs, setCustoms] = useState(null);
  const [quoting, setQuoting] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [loading, user, router]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f,
      fullName: f.fullName || user.name,
      phone: f.phone || user.phone || "",
      wilaya: f.wilaya || user.wilaya || "",
    }));
  }, [user]);

  useEffect(() => {
    fetch("/api/payments/status").then((r) => r.json()).then((g) => {
      setGateways(g);
      setForm((f) => f.paymentMethod ? f : ({ ...f,
        paymentMethod: g.cod ? "cod" : g.sofizpay ? "sofizpay" : g.chargily ? "chargily" : "" }));
    }).catch(() => {});
  }, []);

  const fetchQuotes = useCallback(async (wilaya, deliveryType) => {
    if (!wilaya) { setShipping(null); return; }
    setQuoting(true);
    try {
      const res = await fetch("/api/shipping/quote", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wilaya, deliveryType }),
      });
      const data = await res.json();
      setShipping(data);
      setForm((f) => (data.quotes?.some((q) => q.id === f.shippingCarrier))
        ? f : { ...f, shippingCarrier: data.quotes?.[0]?.id || "" });
    } finally { setQuoting(false); }
  }, []);

  useEffect(() => { fetchQuotes(form.wilaya, form.deliveryType); }, [form.wilaya, form.deliveryType, fetchQuotes]);

  if (!user) return <div className="max-w-lg mx-auto px-4 py-16 text-center">...</div>;
  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <p style={{ color: "var(--color-ink-soft)" }}>{t("emptyCart")}</p>
    </div>
  );

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const selectedQuote = shipping?.quotes?.find((q) => q.id === form.shippingCarrier);
  const shippingCost = selectedQuote?.cost ?? null;
  const grandTotal = subtotal + (shippingCost ?? 0);
  const anyPayment = gateways.cod || gateways.sofizpay || gateways.chargily;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const needsAddress = form.deliveryType !== "pickup";
    if (!form.fullName || !form.phone || !form.wilaya || (needsAddress && !form.address)) return setError(t("fillAllFields"));
    if (!form.shippingCarrier) return setError(t("selectWilayaFirst"));
    if (form.deliveryType === "pickup" && !form.pickupPointId) return setError(t("selectPickupPoint"));
    if (!form.paymentMethod) return setError(t("noPaymentAvailable"));

    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, locale: lang }),
    });
    setSubmitting(false);
    if (res.ok) {
      const data = await res.json();
      clearAfterOrder();
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      if (data.checkoutError) { router.push(`/account/orders/${data.orderId}?payment_error=1`); return; }
      router.push(`/account/orders/${data.orderId}?success=1`);
    } else {
      const data = await res.json().catch(() => ({}));
      if (data.error === "customs_blocked") setError(t("customsBlockedTitle"));
      else setError(data.error === "cod_disabled" ? t("codDisabled") : t("fillAllFields"));
    }
  };

  const inputCls = "w-full rounded-lg px-3 py-2.5 border text-sm";
  const inputStyle = { borderColor: "var(--color-line)", background: "var(--color-paper)" };
  const cardStyle = (active) => ({
    borderColor: active ? "var(--color-brand)" : "var(--color-line)",
    background: "var(--color-paper)",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("checkoutTitle")}</h1>

      <CustomsNotice onStatus={setCustoms} />
      <div className="grid md:grid-cols-3 gap-8">
        <form onSubmit={submit} className="md:col-span-2 flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">{t("fullName")}</label>
            <input value={form.fullName} onChange={(e) => update("fullName", e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("phone")}</label>
            <input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="05XX XX XX XX" className={inputCls} style={inputStyle} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">{t("wilaya")}</label>
            <select value={form.wilaya} onChange={(e) => update("wilaya", e.target.value)} className={inputCls} style={inputStyle}>
              <option value="">—</option>
              {WILAYAS.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">{t("deliveryType")}</label>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: "home", label: t("homeDelivery"), icon: "🏠" }, { id: "pickup", label: t("pickupDelivery"), icon: "📦" }].map((opt) => (
                <label key={opt.id} className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.deliveryType === opt.id)}>
                  <input type="radio" name="deliveryType" checked={form.deliveryType === opt.id} onChange={() => update("deliveryType", opt.id)} />
                  <span>{opt.icon}</span> {opt.label}
                </label>
              ))}
            </div>
          </div>

          {form.deliveryType === "home" ? (
            <div>
              <label className="text-sm font-medium block mb-1">{t("address")}</label>
              <textarea value={form.address} onChange={(e) => update("address", e.target.value)} rows={3} className={inputCls} style={inputStyle} />
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium block mb-1">{t("pickupPoint")}</label>
              {!form.wilaya ? (
                <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("selectWilayaFirst")}</p>
              ) : shipping?.pickupPoints?.length ? (
                <div className="flex flex-col gap-2">
                  {shipping.pickupPoints.map((pp) => (
                    <label key={pp.id} className="flex items-start gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.pickupPointId === pp.id)}>
                      <input type="radio" name="pickupPoint" className="mt-1" checked={form.pickupPointId === pp.id} onChange={() => update("pickupPointId", pp.id)} />
                      <span>
                        <span className="font-medium block">{lang === "ar" ? pp.name_ar : pp.name_fr}</span>
                        <span className="text-xs block" style={{ color: "var(--color-ink-soft)" }}>{lang === "ar" ? pp.address_ar : pp.address_fr}</span>
                        <span className="text-xs block" style={{ color: "var(--color-ink-soft)" }}>🕐 {lang === "ar" ? pp.hours_ar : pp.hours_fr}</span>
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("noPickupPoints")}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-2">{t("shippingMethod")}</label>
            {!form.wilaya ? (
              <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("selectWilayaFirst")}</p>
            ) : quoting ? (
              <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>...</p>
            ) : (
              <div className="flex flex-col gap-2">
                {shipping?.quotes?.map((q) => (
                  <label key={q.id} className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.shippingCarrier === q.id)}>
                    <input type="radio" name="carrier" checked={form.shippingCarrier === q.id} onChange={() => update("shippingCarrier", q.id)} />
                    <span className="flex-1">
                      <span className="font-medium block">{lang === "ar" ? q.label_ar : q.label_fr}</span>
                      <span className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("estimatedDelivery")}: {lang === "ar" ? q.eta_ar : q.eta_fr}</span>
                    </span>
                    <span className="font-mono text-sm shrink-0">{q.cost === 0 ? t("free") : formatPrice(q.cost, lang)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">{t("paymentMethod")}</label>
            <div className="flex flex-col gap-2">
              {gateways.cod && (
                <label className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.paymentMethod === "cod")}>
                  <input type="radio" name="pm" checked={form.paymentMethod === "cod"} onChange={() => update("paymentMethod", "cod")} />
                  {t("cod")}
                </label>
              )}
              {gateways.sofizpay && (
                <label className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.paymentMethod === "sofizpay")}>
                  <input type="radio" name="pm" checked={form.paymentMethod === "sofizpay"} onChange={() => update("paymentMethod", "sofizpay")} />
                  {t("paySofizpay")}
                </label>
              )}
              {gateways.chargily && (
                <label className="flex items-center gap-2 border rounded-lg px-3 py-2.5 text-sm cursor-pointer" style={cardStyle(form.paymentMethod === "chargily")}>
                  <input type="radio" name="pm" checked={form.paymentMethod === "chargily"} onChange={() => update("paymentMethod", "chargily")} />
                  {t("payChargily")}
                </label>
              )}
              {!anyPayment && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{t("noPaymentAvailable")}</p>}
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}

          <button type="submit" disabled={submitting || !anyPayment || customs?.blocked} className="rounded-lg py-3 font-semibold text-sm text-white disabled:opacity-60" style={{ background: "var(--color-accent)" }}>
            {submitting ? "..." : t("placeOrder")}
          </button>
        </form>

        <div className="h-fit rounded-xl border p-5" style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}>
          <h3 className="font-semibold text-sm mb-3">{t("cart")} ({items.length})</h3>
          <div className="flex flex-col gap-2 mb-4 max-h-56 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2 text-xs" style={{ color: "var(--color-ink-soft)" }}>
                <div className="w-9 h-9 rounded overflow-hidden shrink-0" style={{ background: "var(--color-cream)" }}>
                  <ProductImage
                    seed={i.image_seed}
                    urls={i.variant_image || i.image_urls}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="line-clamp-1 flex-1">{i.quantity}× {lang === "ar" ? i.name_ar : i.name_fr}</span>
                <span className="font-mono shrink-0">{formatPrice(i.price * i.quantity, lang)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between text-sm mb-1" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("subtotal")}</span><span className="font-mono">{formatPrice(subtotal, lang)}</span>
          </div>
          {shipping?.weightGrams != null && (
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--color-ink-soft)" }}>
              <span>{t("orderWeight")}</span><span className="font-mono">{(shipping.weightGrams / 1000).toFixed(2)} kg</span>
            </div>
          )}
          <div className="flex justify-between text-sm mb-3" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("shippingCost")}</span>
            <span className="font-mono">{shippingCost == null ? "—" : shippingCost === 0 ? t("free") : formatPrice(shippingCost, lang)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
            <span>{t("total")}</span><span className="font-mono">{formatPrice(grandTotal, lang)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
