"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

function OrderDetailContent() {
  const { t, lang } = useLang();
  const { id } = useParams();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);
  }, [id]);

  if (!data) return <div className="max-w-2xl mx-auto px-4 py-16 text-center">...</div>;

  const { order, items } = data;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {success && (
        <div
          className="rounded-xl p-5 mb-6 text-center"
          style={{ background: "var(--color-brand)", color: "#fff" }}
        >
          <p className="text-2xl mb-1">✓</p>
          <p className="font-bold">{t("orderSuccess")}</p>
          <p className="text-sm opacity-90 mt-1">{t("orderSuccessDesc")} #{order.id}</p>
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
          <div>{t("paymentMethod")}: {order.payment_method === "cod" ? t("cod") : order.payment_method}</div>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--color-line)" }}>
          {items.map((it) => (
            <div key={it.id} className="flex justify-between text-sm">
              <span>{it.quantity}× {lang === "ar" ? it.name_ar : it.name_fr}</span>
              <span className="font-mono">{formatPrice(it.price * it.quantity, lang)}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-bold pt-3 mt-3 border-t" style={{ borderColor: "var(--color-line)" }}>
          <span>{t("total")}</span>
          <span className="font-mono">{formatPrice(order.total, lang)}</span>
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
