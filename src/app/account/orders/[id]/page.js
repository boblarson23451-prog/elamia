"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";
import { getPickupPointById } from "@/lib/pickup-points";

const PAYMENT_METHOD_LABELS = { cod: "cod", chargily: "payChargily", sofizpay: "paySofizpay" };
const PAYMENT_STATUS_STYLE = {
  paid: { key: "paymentPaid", color: "var(--color-brand)" },
  unpaid: { key: "paymentUnpaid", color: "var(--color-gold)" },
  failed: { key: "paymentFailed", color: "var(--color-accent)" },
};

function OrderDetailContent() {
  const { t, lang } = useLang();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const paymentError = searchParams.get("payment_error");
  const [data, setData] = useState(null);
  const [checking, setChecking] = useState(false);

  const load = () => {
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  };

  useEffect(load, [id]);

  // Auto-check payment status once when landing back from an online gateway.
  useEffect(() => {
    if (!success || !data?.order) return;
    const order = data.order;
    if (order.payment_method === "cod" || order.payment_status === "paid") return;

    // SofizPay returns us here; it may include its own order/transaction
    // reference in the query string under one of several possible names.
    // Capture it so we have something authoritative to verify against.
    const returnedOrderNumber =
      searchParams.get("order_number") ||
      searchParams.get("orderNumber") ||
      searchParams.get("order_id") ||
      searchParams.get("transaction_id");

    if (order.payment_method === "sofizpay" && returnedOrderNumber && !order.sofizpay_transaction_id) {
      setChecking(true);
      fetch(`/api/orders/${id}/claim-sofizpay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber: returnedOrderNumber }),
      })
        .finally(() => {
          setChecking(false);
          load();
        });
      return;
    }

    if (order.payment_status === "unpaid") checkStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [success, data?.order?.id]);

  const checkStatus = async () => {
    setChecking(true);
    await fetch(`/api/orders/${id}/sync-payment`, { method: "POST" });
    setChecking(false);
    load();
  };

  if (!data) return <div className="max-w-2xl mx-auto px-4 py-16 text-center">...</div>;

  const { order, items } = data;
  const isOnlinePayment = order.payment_method !== "cod";
  const statusInfo = PAYMENT_STATUS_STYLE[order.payment_status] || PAYMENT_STATUS_STYLE.unpaid;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {success && !paymentError && (
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{ background: "var(--color-brand)", color: "#fff" }}
        >
          <p className="text-2xl mb-1">✓</p>
          <p className="font-bold">{t("orderSuccess")}</p>
          <p className="text-sm opacity-90 mt-1">{t("orderSuccessDesc")} #{order.id}</p>
        </div>
      )}

      {paymentError && (
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          <p className="font-bold">{t("paymentErrorNote")}</p>
        </div>
      )}

      <div className="rounded-xl border p-5" style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}>
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-bold" style={{ color: "var(--color-ink)" }}>{t("orderNumber")} #{order.id}</h1>
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white" style={{ background: "var(--color-brand)" }}>
            {t(order.status)}
          </span>
        </div>

        <div className="text-sm mb-4 grid grid-cols-2 gap-2" style={{ color: "var(--color-ink-soft)" }}>
          <div>{t("fullName")}: {order.full_name}</div>
          <div>{t("phone")}: {order.phone}</div>
          <div>{t("wilaya")}: {order.wilaya}</div>
          <div>{t("paymentMethod")}: {t(PAYMENT_METHOD_LABELS[order.payment_method] || "cod")}</div>
          <div>
            {t("shippingMethod")}:{" "}
            {(lang === "ar" ? order.carrier_label_ar : order.carrier_label_fr) || order.shipping_carrier}
          </div>
          <div>
            {t("estimatedDelivery")}:{" "}
            {(lang === "ar" ? order.carrier_eta_ar : order.carrier_eta_fr) || "—"}
          </div>
          <div>
            {t("deliveryType")}: {order.delivery_type === "pickup" ? t("pickupDelivery") : t("homeDelivery")}
          </div>
        </div>

        {order.delivery_type === "pickup" && (() => {
          const pp = getPickupPointById(order.pickup_point_id);
          if (!pp) return null;
          return (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "var(--color-cream)" }}>
              <div className="font-semibold">📦 {lang === "ar" ? pp.name_ar : pp.name_fr}</div>
              <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                {lang === "ar" ? pp.address_ar : pp.address_fr}
              </div>
              <div className="text-xs" style={{ color: "var(--color-ink-soft)" }}>
                🕐 {lang === "ar" ? pp.hours_ar : pp.hours_fr}
              </div>
            </div>
          );
        })()}

        {isOnlinePayment && (
          <div className="flex items-center justify-between mb-4 p-3 rounded-lg" style={{ background: "var(--color-cream)" }}>
            <div className="text-sm">
              {t("paymentStatus")}:{" "}
              <span className="font-semibold" style={{ color: statusInfo.color }}>{t(statusInfo.key)}</span>
            </div>
            {order.payment_status !== "paid" && (
              <button
                onClick={checkStatus}
                disabled={checking}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border disabled:opacity-50"
                style={{ borderColor: "var(--color-brand)", color: "var(--color-brand)" }}
              >
                {checking ? "..." : t("checkPaymentStatus")}
              </button>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.quantity}× {lang === "ar" ? it.name_ar : it.name_fr}{(lang === "ar" ? it.variant_label_ar : it.variant_label_fr) ? ` — ${lang === "ar" ? it.variant_label_ar : it.variant_label_fr}` : ""}</span>
              <span className="font-mono">{formatPrice(it.price * it.quantity, lang)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 mt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
          <div className="flex justify-between text-sm" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("subtotal")}</span>
            <span className="font-mono">{formatPrice(order.subtotal || (order.total - (order.shipping_cost || 0)), lang)}</span>
          </div>
          <div className="flex justify-between text-sm mb-2" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("shippingCost")}</span>
            <span className="font-mono">{order.shipping_cost === 0 ? t("free") : formatPrice(order.shipping_cost || 0, lang)}</span>
          </div>
          <div className="flex justify-between font-bold">
            <span>{t("total")}</span>
            <span className="font-mono">{formatPrice(order.total, lang)}</span>
          </div>
        </div>
      </div>

      <Link href="/" className="block text-center mt-6 text-sm font-semibold" style={{ color: "var(--color-brand)" }}>
        {t("backHome")}
      </Link>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={null}>
      <OrderDetailContent />
    </Suspense>
  );
}
