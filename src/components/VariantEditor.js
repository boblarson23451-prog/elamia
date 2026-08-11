"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

const BLANK = { v1_fr: "", v1_ar: "", v2_fr: "", v2_ar: "", sku: "", price: "", stock: 0, swatch: "", image_url: "" };

/** Admin/vendor editor for a product's colour/size variants. */
export default function VariantEditor({ productId, apiBase }) {
  const { t } = useLang();
  const [rows, setRows] = useState([]);
  const [opts, setOpts] = useState({ option1_name_fr: "", option1_name_ar: "", option2_name_fr: "", option2_name_ar: "" });
  const [status, setStatus] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!productId) { setLoaded(true); return; }
    fetch(`${apiBase}/${productId}/variants`)
      .then((r) => (r.ok ? r.json() : { variants: [], options: {} }))
      .then((d) => {
        setRows(d.variants || []);
        setOpts({
          option1_name_fr: d.options?.option1_name_fr || "",
          option1_name_ar: d.options?.option1_name_ar || "",
          option2_name_fr: d.options?.option2_name_fr || "",
          option2_name_ar: d.options?.option2_name_ar || "",
        });
      })
      .finally(() => setLoaded(true));
  }, [productId, apiBase]);

  const save = async () => {
    setStatus("saving");
    const res = await fetch(`${apiBase}/${productId}/variants`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...opts, variants: rows }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus(""), 2000);
  };

  const upd = (i, k, v) => setRows((r) => r.map((row, j) => (j === i ? { ...row, [k]: v } : row)));

  if (!productId) {
    return (
      <p className="text-xs" style={{ color: "var(--color-ink-soft)" }}>{t("variantsAfterSave")}</p>
    );
  }
  if (!loaded) return <p className="text-xs">...</p>;

  const f = "rounded-lg px-2 py-1.5 border text-xs w-full";
  const fs = { borderColor: "var(--color-line)", background: "var(--color-paper)" };

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-line)" }}>
      <h3 className="font-semibold text-sm mb-1">{t("variants")}</h3>
      <p className="text-xs mb-3" style={{ color: "var(--color-ink-soft)" }}>{t("variantsHelp")}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <input className={f} style={fs} placeholder={t("option1NameFr")} value={opts.option1_name_fr} onChange={(e) => setOpts({ ...opts, option1_name_fr: e.target.value })} />
        <input className={f} style={fs} placeholder={t("option1NameAr")} dir="rtl" value={opts.option1_name_ar} onChange={(e) => setOpts({ ...opts, option1_name_ar: e.target.value })} />
        <input className={f} style={fs} placeholder={t("option2NameFr")} value={opts.option2_name_fr} onChange={(e) => setOpts({ ...opts, option2_name_fr: e.target.value })} />
        <input className={f} style={fs} placeholder={t("option2NameAr")} dir="rtl" value={opts.option2_name_ar} onChange={(e) => setOpts({ ...opts, option2_name_ar: e.target.value })} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ color: "var(--color-ink-soft)" }}>
              <th className="text-start pb-2 pe-2">Opt.1 FR / AR</th>
              <th className="text-start pb-2 pe-2">Opt.2 FR / AR</th>
              <th className="text-start pb-2 pe-2">{t("swatch")}</th>
              <th className="text-start pb-2 pe-2">{t("price")}</th>
              <th className="text-start pb-2 pe-2">{t("stock")}</th>
              <th className="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="pe-2 pb-2">
                  <div className="flex gap-1">
                    <input className={f} style={fs} value={r.v1_fr || ""} onChange={(e) => upd(i, "v1_fr", e.target.value)} placeholder="Rouge" />
                    <input className={f} style={fs} dir="rtl" value={r.v1_ar || ""} onChange={(e) => upd(i, "v1_ar", e.target.value)} placeholder="أحمر" />
                  </div>
                </td>
                <td className="pe-2 pb-2">
                  <div className="flex gap-1">
                    <input className={f} style={fs} value={r.v2_fr || ""} onChange={(e) => upd(i, "v2_fr", e.target.value)} placeholder="M" />
                    <input className={f} style={fs} dir="rtl" value={r.v2_ar || ""} onChange={(e) => upd(i, "v2_ar", e.target.value)} placeholder="M" />
                  </div>
                </td>
                <td className="pe-2 pb-2">
                  <input type="color" value={r.swatch || "#cccccc"} onChange={(e) => upd(i, "swatch", e.target.value)} className="w-9 h-8 rounded border" style={fs} />
                </td>
                <td className="pe-2 pb-2">
                  <input className={f} style={fs} type="number" value={r.price ?? ""} onChange={(e) => upd(i, "price", e.target.value)} placeholder="=" />
                </td>
                <td className="pe-2 pb-2">
                  <input className={f} style={fs} type="number" value={r.stock ?? 0} onChange={(e) => upd(i, "stock", e.target.value)} />
                </td>
                <td className="pb-2">
                  <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} style={{ color: "var(--color-accent)" }}>✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 mt-3 items-center">
        <button type="button" onClick={() => setRows([...rows, { ...BLANK }])}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
          style={{ borderColor: "var(--color-brand)", color: "var(--color-brand)" }}>
          + {t("addVariant")}
        </button>
        <button type="button" onClick={save} disabled={status === "saving"}
          className="text-xs font-semibold px-4 py-1.5 rounded-lg text-white"
          style={{ background: "var(--color-accent)" }}>
          {status === "saving" ? "..." : t("saveVariants")}
        </button>
        {status === "saved" && <span className="text-xs" style={{ color: "var(--color-brand)" }}>✓</span>}
        {status === "error" && <span className="text-xs" style={{ color: "var(--color-accent)" }}>✕</span>}
      </div>
      <p className="text-[11px] mt-2" style={{ color: "var(--color-ink-soft)" }}>{t("variantPriceHint")}</p>
    </div>
  );
}
