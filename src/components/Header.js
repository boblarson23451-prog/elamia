"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { count, user, setUser } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");

  const onSearch = (e) => {
    e.preventDefault();
    router.push(`/products${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  };

  const onLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40" style={{ background: "var(--color-brand)" }}>
      <div
        className="text-center text-xs py-1.5 px-2"
        style={{ background: "var(--color-brand-dark)", color: "#fff" }}
      >
        {t("freeShippingBanner")}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap md:flex-nowrap">
        <Link href="/" className="shrink-0 flex items-baseline gap-1">
          <span
            className="text-2xl font-extrabold leading-none"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: "var(--font-display)", color: "#fff" }}
          >
            {t("brand")}
          </span>
        </Link>

        <form onSubmit={onSearch} className="flex-1 min-w-[180px] flex order-3 md:order-none w-full md:w-auto">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-s-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--color-paper)", color: "var(--color-ink)" }}
          />
          <button
            type="submit"
            className="rounded-e-lg px-4 font-semibold text-sm"
            style={{ background: "var(--color-gold)", color: "var(--color-ink)" }}
          >
            🔍
          </button>
        </form>

        <div className="flex items-center gap-3 shrink-0 ms-auto">
          <button
            onClick={() => setLang(lang === "ar" ? "fr" : "ar")}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-full border border-white/40 text-white hover:bg-white/10"
          >
            {lang === "ar" ? "FR" : "عربي"}
          </button>

          {user ? (
            <div className="relative group">
              <button className="text-white text-sm flex items-center gap-1">
                👤 <span className="hidden md:inline">{user.name.split(" ")[0]}</span>
              </button>
              <div
                className="absolute end-0 mt-1 hidden group-hover:flex flex-col rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50"
                style={{ background: "var(--color-paper)" }}
              >
                <Link href="/account" className="px-4 py-2 text-sm hover:bg-black/5" style={{ color: "var(--color-ink)" }}>
                  {t("myOrders")}
                </Link>
                {user.role === "admin" && (
                  <Link href="/admin" className="px-4 py-2 text-sm hover:bg-black/5" style={{ color: "var(--color-ink)" }}>
                    {t("adminDashboard")}
                  </Link>
                )}
                {user.role === "vendor" && (
                  <Link href="/vendor" className="px-4 py-2 text-sm hover:bg-black/5" style={{ color: "var(--color-ink)" }}>
                    {t("vendorDashboard")}
                  </Link>
                )}
                {user.role === "customer" && (
                  <Link href="/sell" className="px-4 py-2 text-sm hover:bg-black/5" style={{ color: "var(--color-ink)" }}>
                    {t("sellOnElalamia")}
                  </Link>
                )}
                <button onClick={onLogout} className="px-4 py-2 text-sm text-start hover:bg-black/5" style={{ color: "var(--color-accent)" }}>
                  {t("logout")}
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" className="text-white text-sm">
              {t("login")}
            </Link>
          )}

          <Link href="/cart" className="relative text-white text-lg">
            🛒
            {count > 0 && (
              <span
                className="absolute -top-2 -end-2 text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
