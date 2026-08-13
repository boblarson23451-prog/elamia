"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useLang } from "@/context/LangContext";
import { useCart } from "@/context/CartContext";

export default function AdminLayout({ children }) {
  const { t } = useLang();
  const { user, loading } = useCart();
  const pathname = usePathname();

  // Previously this silently redirected to /login, which looked like the admin
  // page "doing nothing". Now it states what's wrong.
  if (loading) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center" style={{ color: "var(--color-ink-soft)" }}>…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="mb-4" style={{ color: "var(--color-ink)" }}>{t("adminNeedsLogin")}</p>
        <Link href="/login" className="inline-block rounded-lg px-6 py-3 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          {t("login")}
        </Link>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="mb-2 font-semibold" style={{ color: "var(--color-accent)" }}>{t("adminOnly")}</p>
        <p className="text-sm mb-4" style={{ color: "var(--color-ink-soft)" }}>
          {t("loggedInAs")}: {user.email} ({user.role})
        </p>
        <Link href="/" className="text-sm font-semibold" style={{ color: "var(--color-brand)" }}>{t("backHome")}</Link>
      </div>
    );
  }

  const links = [
    { href: "/admin", label: t("adminDashboard") },
    { href: "/admin/products", label: t("manageProducts") },
    { href: "/admin/orders", label: t("manageOrders") },
    { href: "/admin/vendors", label: t("manageVendors") },
    { href: "/admin/affiliates", label: t("manageAffiliates") },
    { href: "/admin/categories", label: t("manageCategories") },
    { href: "/admin/content", label: t("editContent") },
    { href: "/admin/settings", label: t("settings") },
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
