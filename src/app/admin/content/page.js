"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

export default function AdminContentPage() {
  const { t, lang } = useLang();
  const [data, setData] = useState(null);
  const [vals, setVals] = useState({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/content").then((r) => r.json()).then((d) => {
      setData(d);
      const seeded = {};
      for (const g of d.schema || []) {
        for (const k of g.keys) {
          seeded[k.key] = {
            fr: d.overrides?.[k.key]?.fr ?? "",
            ar: d.overrides?.[k.key]?.ar ?? "",
          };
        }
      }
      setVals(seeded);
    });
  }, []);

  const save = async () => {
    setStatus("saving");
    const res = await fetch("/api/admin/content", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries: vals }),
    });
    setStatus(res.ok ? "saved" : "error");
    setTimeout(() => setStatus(""), 2500);
  };

  if (!data) return <p>…</p>;
  const box = { borderColor: "var(--color-line)", background: "var(--color-paper)" };

  return (
    <div>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ink)" }}>{t("editContent")}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>{t("contentHelp")}</p>

      <div className="flex flex-col gap-5">
        {(data.schema || []).map((g) => (
          <div key={g.group_fr} className="rounded-xl border p-4" style={box}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ink)" }}>
              {lang === "ar" ? g.group_ar : g.group_fr}
            </h2>
            <div className="flex flex-col gap-4">
              {g.keys.map((k) => {
                const def = data.defaults?.[k.key] || {};
                const Field = k.long ? "textarea" : "input";
                return (
                  <div key={k.key}>
                    <label className="text-xs font-medium block mb-1" style={{ color: "var(--color-ink)" }}>
                      {lang === "ar" ? k.label_ar : k.label_fr}
                    </label>
                    <div className="grid md:grid-cols-2 gap-2">
                      <div>
                        <Field
                          rows={k.long ? 3 : undefined}
                          value={vals[k.key]?.fr ?? ""}
                          placeholder={def.fr}
                          onChange={(e) => setVals({ ...vals, [k.key]: { ...vals[k.key], fr: e.target.value } })}
                          className="w-full rounded-lg px-3 py-2 border text-sm"
                          style={box}
                        />
                        <span className="text-[10px]" style={{ color: "var(--color-ink-soft)" }}>FR</span>
                      </div>
                      <div>
                        <Field
                          rows={k.long ? 3 : undefined}
                          dir="rtl"
                          value={vals[k.key]?.ar ?? ""}
                          placeholder={def.ar}
                          onChange={(e) => setVals({ ...vals, [k.key]: { ...vals[k.key], ar: e.target.value } })}
                          className="w-full rounded-lg px-3 py-2 border text-sm"
                          style={box}
                        />
                        <span className="text-[10px]" style={{ color: "var(--color-ink-soft)" }}>AR</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        <button onClick={save} disabled={status === "saving"}
          className="rounded-lg px-6 py-2.5 font-semibold text-sm text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}>
          {status === "saving" ? "…" : t("save")}
        </button>
        {status === "saved" && <span className="text-sm" style={{ color: "var(--color-brand)" }}>✓ {t("saved")}</span>}
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--color-ink-soft)" }}>{t("contentEmptyHint")}</p>
      <p className="text-xs mt-1" style={{ color: "var(--color-ink-soft)" }}>{t("contentReloadHint")}</p>
    </div>
  );
}
