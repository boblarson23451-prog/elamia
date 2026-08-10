"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

export default function AdminLayout({ children }) {
  const { t } = useLang();
  const { user, loading } = useCart();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (!user || user.role !== "admin") {
    return <div className="max-w-md mx-auto px-4 py-16 text-center">...</div>;
  }

  const links = [
    { href: "/admin", label: t("adminDashboard") },
    { href: "/admin/products", label: t("manageProducts") },
    { href: "/admin/orders", label: t("manageOrders") },
    { href: "/admin/vendors", label: t("manageVendors") },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-[180px_1fr] gap-6">
      <aside className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
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
