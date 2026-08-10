"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

export default function VendorLayout({ children }) {
  const { t } = useLang();
  const { user, loading } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [vendor, setVendor] = useState(undefined);

  useEffect(() => {
    fetch("/api/vendor/me")
      .then((r) => r.json())
      .then((d) => setVendor(d.vendor));
  }, []);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [loading, user, router]);

  if (loading || vendor === undefined) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center">...</div>;
  }

  if (!user) return <div className="max-w-md mx-auto px-4 py-16 text-center">...</div>;

  if (!vendor || vendor.status !== "approved") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="mb-4" style={{ color: "var(--color-ink-soft)" }}>
          {vendor?.status === "pending" ? t("applicationPendingNote") : t("sellSubtitle")}
        </p>
        <Link href="/sell" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {vendor ? t("myStore") : t("sellOnElalamia")}
        </Link>
      </div>
    );
  }

  const links = [
    { href: "/vendor", label: t("vendorDashboard") },
    { href: "/vendor/products", label: t("vendorProducts") },
    { href: "/vendor/orders", label: t("vendorOrders") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[180px_1fr] gap-6">
      <aside className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
        <div className="text-xs font-semibold px-1 mb-1 hidden md:block" style={{ color: "var(--color-ink-soft)" }}>
          🏪 {vendor.store_name}
        </div>
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="text-sm px-3 py-2 rounded-lg whitespace-nowrap"
            style={{
              background: pathname === l.href ? "var(--color-brand)" : "var(--color-paper)",
              color: pathname === l.href ? "#fff" : "var(--color-ink)",
              border: "1px solid var(--color-line)",
            }}
          >
            {l.label}
          </Link>
        ))}
      </aside>
      <div>{children}</div>
    </div>
  );
}
