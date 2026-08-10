"use client";

import { useLang } from "@/context/LangContext";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}>
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-extrabold text-lg mb-2" style={{ fontFamily: "var(--font-display)", color: "var(--color-brand)" }}>
            {t("brand")}
          </div>
          <p style={{ color: "var(--color-ink-soft)" }}>{t("tagline")}</p>
        </div>
        <div>
          <div className="font-semibold mb-2">🇩🇿 58 wilayas</div>
          <p style={{ color: "var(--color-ink-soft)" }}>{t("cod")}</p>
        </div>
        <div>
          <div className="font-semibold mb-2">{t("categories")}</div>
          <p style={{ color: "var(--color-ink-soft)" }}>{t("allProducts")}</p>
        </div>
        <div>
          <div className="font-semibold mb-2">{t("becomeVendorCta")}</div>
          <a href="/sell" className="hover:underline" style={{ color: "var(--color-brand)" }}>{t("sellOnElalamia")}</a>
        </div>
        <div>
          <div className="font-semibold mb-2">{t("legal")}</div>
          <ul className="flex flex-col gap-1 text-xs" style={{ color: "var(--color-ink-soft)" }}>
            <li><a href="/legal/mentions-legales" className="hover:underline">{t("legalNotice")}</a></li>
            <li><a href="/legal/cgv" className="hover:underline">{t("terms")}</a></li>
            <li><a href="/legal/retours" className="hover:underline">{t("returnsPolicy")}</a></li>
            <li><a href="/legal/confidentialite" className="hover:underline">{t("privacy")}</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs py-4 border-t" style={{ borderColor: "var(--color-line)", color: "var(--color-ink-soft)" }}>
        © {new Date().getFullYear()} ELALAMIA
      </div>
    </footer>
  );
}
