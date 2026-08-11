"use client";

import { useLang } from "@/context/LangContext";

/**
 * Two-level variant picker (e.g. Colour then Size).
 * Options unavailable in combination with the current selection are shown
 * struck-through rather than hidden, so shoppers can see the full range and
 * understand what's out of stock.
 */
export default function VariantSelector({ product, variants, selected, onSelect }) {
  const { t, lang } = useLang();
  if (!variants || variants.length === 0) return null;

  const val = (v, n) => (lang === "ar" ? v[`v${n}_ar`] || v[`v${n}_fr`] : v[`v${n}_fr`] || v[`v${n}_ar`]);
  const optName = (n) =>
    (lang === "ar" ? product[`option${n}_name_ar`] || product[`option${n}_name_fr`]
                   : product[`option${n}_name_fr`] || product[`option${n}_name_ar`]) ||
    (n === 1 ? t("option1Default") : t("option2Default"));

  const level1 = [...new Set(variants.map((v) => val(v, 1)).filter(Boolean))];
  const hasLevel2 = variants.some((v) => val(v, 2));

  const sel1 = selected ? val(selected, 1) : null;
  const level2 = hasLevel2
    ? [...new Set(variants.filter((v) => !sel1 || val(v, 1) === sel1).map((v) => val(v, 2)).filter(Boolean))]
    : [];

  const findVariant = (v1, v2) =>
    variants.find((v) => (!v1 || val(v, 1) === v1) && (!v2 || val(v, 2) === v2));

  const stockFor = (v1, v2) => {
    const matches = variants.filter((v) => (!v1 || val(v, 1) === v1) && (!v2 || val(v, 2) === v2));
    return matches.reduce((s, v) => s + v.stock, 0);
  };

  const pill = (label, isActive, isOut, onClick, swatch) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      disabled={isOut}
      className="px-3 py-1.5 rounded-lg border text-sm flex items-center gap-1.5 disabled:opacity-40"
      style={{
        borderColor: isActive ? "var(--color-accent)" : "var(--color-line)",
        background: isActive ? "rgba(221,75,46,0.08)" : "var(--color-paper)",
        color: "var(--color-ink)",
        textDecoration: isOut ? "line-through" : "none",
      }}
    >
      {swatch && (
        <span
          className="w-4 h-4 rounded-full border shrink-0"
          style={{ background: swatch, borderColor: "var(--color-line)" }}
        />
      )}
      {label}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 mt-4">
      <div>
        <div className="text-sm font-medium mb-2" style={{ color: "var(--color-ink)" }}>
          {optName(1)}
          {sel1 && <span style={{ color: "var(--color-ink-soft)" }}> : {sel1}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {level1.map((l1) => {
            const swatch = variants.find((v) => val(v, 1) === l1)?.swatch;
            return pill(
              l1,
              sel1 === l1,
              stockFor(l1, null) <= 0,
              () => onSelect(findVariant(l1, hasLevel2 ? null : undefined) || null),
              swatch
            );
          })}
        </div>
      </div>

      {hasLevel2 && (
        <div>
          <div className="text-sm font-medium mb-2" style={{ color: "var(--color-ink)" }}>
            {optName(2)}
            {selected && val(selected, 2) && (
              <span style={{ color: "var(--color-ink-soft)" }}> : {val(selected, 2)}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {level2.map((l2) =>
              pill(
                l2,
                selected && val(selected, 2) === l2,
                stockFor(sel1, l2) <= 0,
                () => onSelect(findVariant(sel1, l2) || null)
              )
            )}
          </div>
          {!sel1 && (
            <p className="text-xs mt-2" style={{ color: "var(--color-ink-soft)" }}>
              {t("chooseOption1First").replace("{option}", optName(1))}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
