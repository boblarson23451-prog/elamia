"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/i18n";
import ProductImage from "@/components/ProductImage";
import CustomsNotice from "@/components/CustomsNotice";

export default function CartPage() {
  const { t, field, lang } = useLang();
  const { items, loading, subtotal, updateQuantity, removeItem, user } = useCart();

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-16 text-center">...</div>;

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="mb-4" style={{ color: "var(--color-ink-soft)" }}>{t("emptyCart")}</p>
        <Link href="/login" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("login")}
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-4">🛒</p>
        <p className="mb-4" style={{ color: "var(--color-ink-soft)" }}>{t("emptyCart")}</p>
        <Link href="/products" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("cart")}</h1>

      <CustomsNotice />

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 p-3 rounded-xl border items-center"
              style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
            >
              <Link href={`/products/${item.slug}`} className="shrink-0 w-20 h-20 rounded-lg overflow-hidden">
                <ProductImage seed={item.image_seed} alt={field(item, "name")} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.slug}`} className="text-sm font-medium line-clamp-2" style={{ color: "var(--color-ink)" }}>
                  {field(item, "name")}
                </Link>
                <div className="mt-1 font-mono text-sm" style={{ color: "var(--color-accent-dark, #B93A22)" }}>
                  {formatPrice(item.price, lang)}
                </div>
              </div>
              <div className="flex items-center border rounded-lg shrink-0" style={{ borderColor: "var(--color-line)" }}>
                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="px-2.5 py-1.5">−</button>
                <span className="px-3 font-mono text-sm">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="px-2.5 py-1.5">+</button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-xs shrink-0"
                style={{ color: "var(--color-accent)" }}
              >
                {t("remove")}
              </button>
            </div>
          ))}
        </div>

        <div
          className="h-fit rounded-xl border p-5"
          style={{ background: "var(--color-paper)", borderColor: "var(--color-line)" }}
        >
          <div className="flex justify-between text-sm mb-2" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("subtotal")}</span>
            <span className="font-mono">{formatPrice(subtotal, lang)}</span>
          </div>
          <div className="flex justify-between text-sm mb-4" style={{ color: "var(--color-ink-soft)" }}>
            <span>{t("shipping")}</span>
            <span>{t("free")}</span>
          </div>
          <div className="flex justify-between font-bold text-base mb-4 pt-3 border-t" style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}>
            <span>{t("total")}</span>
            <span className="font-mono">{formatPrice(subtotal, lang)}</span>
          </div>
          <Link
            href="/checkout"
            className="block text-center rounded-lg py-3 font-semibold text-sm text-white"
            style={{ background: "var(--color-accent)" }}
          >
            {t("proceedCheckout")}
          </Link>
        </div>
      </div>
    </div>
  );
}
