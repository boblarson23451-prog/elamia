"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

export default function AdminCategoriesPage() {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const [adding, setAdding] = useState({ name_fr: "", name_ar: "", icon: "🛍️" });
  const [msg, setMsg] = useState("");

  const load = () => fetch("/api/admin/categories").then((r) => r.json()).then((d) => setRows(d.categories || []));
  useEffect(load, []);

  const create = async (e) => {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/admin/categories", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(adding),
    });
    if (res.ok) { setAdding({ name_fr: "", name_ar: "", icon: "🛍️" }); load(); }
    else setMsg(t("fillAllFields"));
  };

  const update = async (id, patch) => {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    load();
  };

  const remove = async (id) => {
    if (!confirm(t("delete") + " ?")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error === "category_not_empty"
        ? t("categoryNotEmpty").replace("{n}", d.productCount)
        : t("cannotDelete"));
    } else { setMsg(""); load(); }
  };

  const box = { borderColor: "var(--color-line)", background: "var(--color-paper)" };
  const inp = "rounded-lg px-3 py-2 border text-sm";

  return (
    <div>
      <h1 className="text-xl font-bold mb-6" style={{ color: "var(--color-ink)" }}>{t("manageCategories")}</h1>

      <form onSubmit={create} className="rounded-xl border p-4 mb-5 flex flex-wrap gap-2 items-end" style={box}>
        <div>
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("icon")}</label>
          <input value={adding.icon} onChange={(e) => setAdding({ ...adding, icon: e.target.value })} className={inp} style={{ ...box, width: 70 }} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("nameFr")}</label>
          <input value={adding.name_fr} onChange={(e) => setAdding({ ...adding, name_fr: e.target.value })} className={`${inp} w-full`} style={box} />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="text-xs block mb-1" style={{ color: "var(--color-ink-soft)" }}>{t("nameAr")}</label>
          <input dir="rtl" value={adding.name_ar} onChange={(e) => setAdding({ ...adding, name_ar: e.target.value })} className={`${inp} w-full`} style={box} />
        </div>
        <button type="submit" className="rounded-lg px-4 py-2 font-semibold text-sm text-white" style={{ background: "var(--color-accent)" }}>
          + {t("add")}
        </button>
      </form>

      {msg && <p className="text-sm mb-3" style={{ color: "var(--color-accent)" }}>{msg}</p>}

      {rows === null ? <p>…</p> : (
        <div className="flex flex-col gap-2">
          {rows.map((c) => (
            <div key={c.id} className="rounded-xl border p-3 flex flex-wrap items-center gap-2" style={box}>
              <input defaultValue={c.icon} onBlur={(e) => update(c.id, { icon: e.target.value })} className={inp} style={{ ...box, width: 60 }} />
              <input defaultValue={c.name_fr} onBlur={(e) => update(c.id, { name_fr: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={box} />
              <input dir="rtl" defaultValue={c.name_ar} onBlur={(e) => update(c.id, { name_ar: e.target.value })} className={`${inp} flex-1 min-w-[140px]`} style={box} />
              <input type="number" defaultValue={c.sort_order} onBlur={(e) => update(c.id, { sort_order: Number(e.target.value) })} className={inp} style={{ ...box, width: 70 }} title={t("sortOrder")} />
              <span className="text-xs shrink-0" style={{ color: "var(--color-ink-soft)" }}>
                {c.product_count} {t("productsWord")}
              </span>
              <button onClick={() => remove(c.id)} className="text-xs font-semibold shrink-0" style={{ color: "var(--color-accent)" }}>
                {t("delete")}
              </button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs mt-3" style={{ color: "var(--color-ink-soft)" }}>{t("categoryEditHint")}</p>
    </div>
  );
}
