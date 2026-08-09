"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";

export default function Hero() {
  const { t } = useLang();
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)" }}
    >
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h1
            className="text-3xl md:text-5xl font-extrabold text-white leading-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("heroTitle")}
          </h1>
          <p className="text-white/85 mt-4 text-base md:text-lg max-w-md">{t("heroSubtitle")}</p>
          <Link
            href="/products"
            className="inline-block mt-6 rounded-lg px-6 py-3 font-bold text-sm"
            style={{ background: "var(--color-accent)", color: "#fff" }}
          >
            {t("shopNow")}
          </Link>
        </div>

        {/* Signature souk-ticket cluster */}
        <div className="relative h-56 md:h-64 hidden sm:block" aria-hidden="true">
          <div
            className="price-ticket absolute top-2 start-6 rotate-[-8deg] text-lg font-bold shadow-lg"
            style={{ color: "var(--color-accent-dark)" }}
          >
            990 DA
          </div>
          <div
            className="price-ticket absolute top-20 start-32 rotate-[5deg] text-2xl font-bold shadow-lg"
            style={{ color: "var(--color-accent-dark)" }}
          >
            2 490 DA
          </div>
          <div
            className="price-ticket absolute bottom-4 start-4 rotate-[3deg] text-base font-bold shadow-lg"
            style={{ color: "var(--color-accent-dark)" }}
          >
            1 590 DA
          </div>
          <span
            className="stamp-badge absolute top-0 end-6 text-sm px-3 py-1.5 rotate-[10deg] shadow-xl"
          >
            -50%
          </span>
          <span
            className="stamp-badge absolute bottom-10 end-16 text-xs px-2.5 py-1 rotate-[-14deg] shadow-xl"
          >
            -35%
          </span>
        </div>
      </div>
    </section>
  );
}
