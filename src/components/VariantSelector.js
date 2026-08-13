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

  const raw = (v, n) => (lang === "ar" ? v[`v${n}_ar`] || v[`v${n}_fr`] : v[`v${n}_fr`] || v[`v${n}_ar`]);
  // Group case- and whitespace-insensitively: existing data may contain
  // "S" and "s " which should be one button, not three.
  const val = (v, n) => {
    const x = raw(v, n);
    return x == null ? x : String(x).trim().replace(/\s+/g, " ");
  };
  const key = (x) => (x == null ? x : String(x).trim().toLowerCase());
  const optName = (n) =>
    (lang === "ar" ? product[`option${n}_name_ar`] || product[`option${n}_name_fr`]
                   : product[`option${n}_name_fr`] || product[`option${n}_name_ar`]) ||
    (n === 1 ? t("option1Default") : t("option2Default"));

  const uniq = (arr) => {
    const seen = new Map();
    for (const x of arr) if (x && !seen.has(key(x))) seen.set(key(x), x);
    return [...seen.values()];
  };
  const level1 = uniq(variants.map((v) => val(v, 1)));
  const hasLevel2 = variants.some((v) => val(v, 2));

  const sel1 = selected ? val(selected, 1) : null;
  const level2 = hasLevel2
    ? uniq(variants.filter((v) => !sel1 || key(val(v, 1)) === key(sel1)).map((v) => val(v, 2)))
    : [];

  const findVariant = (v1, v2) =>
    variants.find((v) => (!v1 || key(val(v, 1)) === key(v1)) && (!v2 || key(val(v, 2)) === key(v2)));

  const stockFor = (v1, v2) => {
    const matches = variants.filter((v) => (!v1 || key(val(v, 1)) === key(v1)) && (!v2 || key(val(v, 2)) === key(v2)));
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
              key(sel1) === key(l1),
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
                selected && key(val(selected, 2)) === key(l2),
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
