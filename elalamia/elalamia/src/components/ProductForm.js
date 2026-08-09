"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/context/LangContext";

export default function ProductForm({ initial, productId }) {
  const { t } = useLang();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(
    initial || {
      name_ar: "",
      name_fr: "",
      description_ar: "",
      description_fr: "",
      price: "",
      compare_at_price: "",
      category_id: "",
      image_seed: "",
      stock: 50,
    }
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then((r) => r.json()).then((d) => {
      setCategories(d.categories || []);
      setForm((f) => (f.category_id ? f : { ...f, category_id: d.categories?.[0]?.id || "" }));
    });
  }, []);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name_ar || !form.name_fr || !form.price || !form.category_id) {
      setError(t("fillAllFields"));
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      price: parseInt(form.price, 10),
      compare_at_price: form.compare_at_price ? parseInt(form.compare_at_price, 10) : null,
      category_id: parseInt(form.category_id, 10),
      stock: parseInt(form.stock, 10) || 0,
    };
    const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = productId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError(t("fillAllFields"));
    }
  };

  const field = "w-full rounded-lg px-3 py-2.5 border text-sm";
  const fieldStyle = { borderColor: "var(--color-line)", background: "var(--color-paper)" };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">{t("nameAr")}</label>
          <input value={form.name_ar} onChange={(e) => update("name_ar", e.target.value)} className={field} style={fieldStyle} dir="rtl" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">{t("nameFr")}</label>
          <input value={form.name_fr} onChange={(e) => update("name_fr", e.target.value)} className={field} style={fieldStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">{t("descAr")}</label>
          <textarea value={form.description_ar} onChange={(e) => update("description_ar", e.target.value)} rows={3} className={field} style={fieldStyle} dir="rtl" />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">{t("descFr")}</label>
          <textarea value={form.description_fr} onChange={(e) => update("description_fr", e.target.value)} rows={3} className={field} style={fieldStyle} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">{t("price")} (DA)</label>
          <input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} className={field} style={fieldStyle} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">{t("comparePrice")}</label>
          <input type="number" value={form.compare_at_price || ""} onChange={(e) => update("compare_at_price", e.target.value)} className={field} style={fieldStyle} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">{t("stock")}</label>
          <input type="number" value={form.stock} onChange={(e) => update("stock", e.target.value)} className={field} style={fieldStyle} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium block mb-1">{t("category")}</label>
          <select value={form.category_id} onChange={(e) => update("category_id", e.target.value)} className={field} style={fieldStyle}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name_fr} / {c.name_ar}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Image seed</label>
          <input
            value={form.image_seed}
            onChange={(e) => update("image_seed", e.target.value)}
            placeholder="ex: mon-produit-1"
            className={field}
            style={fieldStyle}
          />
        </div>
      </div>

      {error && <p className="text-sm" style={{ color: "var(--color-accent)" }}>{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg px-6 py-2.5 font-semibold text-sm text-white disabled:opacity-60"
          style={{ background: "var(--color-accent)" }}
        >
          {saving ? "..." : t("save")}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-lg px-6 py-2.5 font-semibold text-sm border"
          style={{ borderColor: "var(--color-line)", color: "var(--color-ink)" }}
        >
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
