"use client";

import { useLang } from "@/context/LangContext";

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="mt-16 border-t" style={{ borderColor: "var(--color-line)", background: "var(--color-paper)" }}>
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <svg width="26" height="26" viewBox="0 0 100 100" aria-hidden="true">
              <polygon points="93,50 71.5,87.2 28.5,87.2 7,50 28.5,12.8 71.5,12.8" fill="var(--color-brand)" />
              <polygon points="85,50 67.5,80.3 32.5,80.3 15,50 32.5,19.7 67.5,19.7" fill="none" stroke="var(--color-gold)" strokeWidth="2.5" />
            </svg>
            <span className="font-extrabold text-xl leading-none" dir="rtl" lang="ar" style={{ fontFamily: "var(--font-display)", color: "var(--color-brand)" }}>
              {t("brand")}
            </span>
          </div>
          <div className="text-[11px] tracking-widest mb-2" style={{ color: "var(--color-ink-soft)" }}>
            {t("brandLatin")}
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
          <a href="/sell" className="hover:underline block" style={{ color: "var(--color-brand)" }}>{t("sellOnElalamia")}</a>
          <a href="/affiliate" className="hover:underline block mt-1" style={{ color: "var(--color-brand)" }}>{t("affiliateProgram")}</a>
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
