"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";
import { formatPrice } from "@/lib/i18n";

/** Shows customs duty warnings and seizure-risk blocks for the current cart. */
export default function CustomsNotice({ onStatus }) {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/customs/check")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        setData(d);
        if (onStatus) onStatus(d);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!data) return null;
  if (!data.blocked && (!data.warnings || data.warnings.length === 0)) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {data.blockReasons?.map((r, i) => (
        <div
          key={`b${i}`}
          className="rounded-xl p-4 text-sm"
          style={{ background: "#FEE2E2", border: "1px solid var(--color-accent)", color: "#7F1D1D" }}
        >
          <strong>{t("customsBlockedTitle")}</strong>
          <p className="mt-1">
            {t("customsBlockedBody")
              .replace("{category}", lang === "ar" ? r.category_ar : r.category_fr)
              .replace("{qty}", r.qty)
              .replace("{max}", r.max)}
          </p>
        </div>
      ))}

      {data.warnings?.map((w, i) => (
        <div
          key={`w${i}`}
          className="rounded-xl p-4 text-sm"
          style={{ background: "#FEF3C7", border: "1px solid var(--color-gold)", color: "#7C4A03" }}
        >
          {w.code === "duty_applies" && (
            <>
              <strong>{t("customsDutyTitle")}</strong>
              <p className="mt-1">
                {t("customsDutyBody")
                  .replace("{threshold}", w.thresholdUsd)
                  .replace("{rate}", w.ratePct)
                  .replace("{amount}", formatPrice(w.estimatedDutyDzd, lang))}
              </p>
            </>
          )}
          {w.code === "declaration_required" && (
            <>
              <strong>{t("customsDeclarationTitle")}</strong>
              <p className="mt-1">
                {t("customsDeclarationBody").replace("{threshold}", w.thresholdUsd)}
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
