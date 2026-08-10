"use client";

import { useLang } from "@/context/LangContext";

export default function OfflinePage() {
  const { t } = useLang();
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <p className="text-5xl mb-4">📶</p>
      <h1 className="text-xl font-bold mb-2" style={{ color: "var(--color-ink)" }}>
        {t("offlineTitle")}
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>
        {t("offlineDesc")}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="rounded-lg px-6 py-3 font-semibold text-sm text-white"
        style={{ background: "var(--color-accent)" }}
      >
        {t("retry")}
      </button>
    </div>
  );
}
