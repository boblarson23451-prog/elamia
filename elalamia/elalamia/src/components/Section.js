"use client";

import { useLang } from "@/context/LangContext";

export default function Section({ titleKey, title, subtitle, children, action }) {
  const { t } = useLang();
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold" style={{ fontFamily: "var(--font-display)", color: "var(--color-ink)" }}>
            {titleKey ? t(titleKey) : title}
          </h2>
          {subtitle && <p className="text-sm mt-1" style={{ color: "var(--color-ink-soft)" }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
