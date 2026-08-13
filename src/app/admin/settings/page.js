"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/context/LangContext";

const GROUPS = [
  {
    title_fr: "Livraison — UPS", title_ar: "التوصيل — UPS",
    fields: [
      { k: "ups_base_fee", l_fr: "Frais de base (DA)", l_ar: "الرسم الأساسي (دج)" },
      { k: "ups_per_kg", l_fr: "Prix par kg (DA)", l_ar: "السعر لكل كغ (دج)" },
      { k: "ups_eta_fr", l_fr: "Délai (FR)", l_ar: "المدة (فرنسي)", text: true },
      { k: "ups_eta_ar", l_fr: "Délai (AR)", l_ar: "المدة (عربي)", text: true },
    ],
  },
  {
    title_fr: "Livraison — EMS", title_ar: "التوصيل — EMS",
    fields: [
      { k: "ems_base_fee", l_fr: "Frais de base (DA)", l_ar: "الرسم الأساسي (دج)" },
      { k: "ems_per_kg", l_fr: "Prix par kg (DA)", l_ar: "السعر لكل كغ (دج)" },
      { k: "ems_eta_fr", l_fr: "Délai (FR)", l_ar: "المدة (فرنسي)", text: true },
      { k: "ems_eta_ar", l_fr: "Délai (AR)", l_ar: "المدة (عربي)", text: true },
    ],
  },
  {
    title_fr: "Zones & remises", title_ar: "المناطق والتخفيضات",
    fields: [
      { k: "zone2_multiplier", l_fr: "Multiplicateur zone 2 (hauts plateaux)", l_ar: "معامل المنطقة 2", step: "0.05" },
      { k: "zone3_multiplier", l_fr: "Multiplicateur zone 3 (grand sud)", l_ar: "معامل المنطقة 3", step: "0.05" },
      { k: "pickup_discount_rate", l_fr: "Remise point relais (0.25 = 25%)", l_ar: "تخفيض نقطة الاستلام", step: "0.05" },
      { k: "free_shipping_threshold", l_fr: "Livraison gratuite à partir de (DA, 0 = désactivé)", l_ar: "التوصيل مجاني ابتداءً من (دج)" },
    ],
  },
  {
    title_fr: "Douane", title_ar: "الجمارك",
    fields: [
      { k: "customs_usd_rate", l_fr: "Taux USD → DA", l_ar: "سعر الدولار بالدينار", step: "0.5" },
      { k: "duty_threshold_usd", l_fr: "Seuil droits de douane (USD)", l_ar: "عتبة الرسوم الجمركية (دولار)" },
      { k: "duty_rate", l_fr: "Taux de droits (0.30 = 30%)", l_ar: "نسبة الرسوم", step: "0.01" },
      { k: "declaration_threshold_usd", l_fr: "Seuil déclaration (USD)", l_ar: "عتبة التصريح (دولار)" },
      { k: "same_genre_max", l_fr: "Max articles d'un même genre", l_ar: "أقصى عدد لنفس الصنف" },
    ],
  },
  {
    title_fr: "Affiliation & retours", title_ar: "الشراكة والإرجاع",
    fields: [
      { k: "default_commission_rate", l_fr: "Commission par défaut (0.05 = 5%)", l_ar: "العمولة الافتراضية", step: "0.01" },
      { k: "attribution_days", l_fr: "Durée d'attribution (jours)", l_ar: "مدة الاحتساب (أيام)" },
      { k: "return_window_days", l_fr: "Délai de retour (jours)", l_ar: "أجل الإرجاع (أيام)" },
      { k: "affiliate_payout_terms_fr", l_fr: "Conditions de paiement affiliés (FR)", l_ar: "شروط الدفع (فرنسي)", text: true },
      { k: "affiliate_payout_terms_ar", l_fr: "Conditions de paiement affiliés (AR)", l_ar: "شروط الدفع (عربي)", text: true },
    ],
  },
  {
    title_fr: "Identité de l'entreprise (pages légales)", title_ar: "هوية الشركة (الصفحات القانونية)",
    fields: [
      { k: "company_legal_name", l_fr: "Dénomination sociale", l_ar: "التسمية الاجتماعية", text: true },
      { k: "company_legal_form", l_fr: "Forme juridique (EURL, SARL…)", l_ar: "الشكل القانوني", text: true },
      { k: "company_address", l_fr: "Adresse du siège", l_ar: "عنوان المقر", text: true },
      { k: "company_wilaya", l_fr: "Wilaya", l_ar: "الولاية", text: true },
      { k: "company_rc", l_fr: "N° registre de commerce", l_ar: "رقم السجل التجاري", text: true },
      { k: "company_nif", l_fr: "NIF", l_ar: "رقم التعريف الجبائي", text: true },
      { k: "company_nis", l_fr: "NIS", l_ar: "رقم التعريف الإحصائي", text: true },
      { k: "company_phone", l_fr: "Téléphone", l_ar: "الهاتف", text: true },
      { k: "company_email", l_fr: "E-mail de contact", l_ar: "البريد الإلكتروني", text: true },
      { k: "company_director", l_fr: "Directeur de la publication", l_ar: "مدير النشر", text: true },
      { k: "company_hosting", l_fr: "Hébergeur (nom et pays)", l_ar: "المستضيف", text: true },
    ],
  },
];

export default function AdminSettingsPage() {
  const { t, lang } = useLang();
  const [values, setValues] = useState(null);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState({});

  const load = () => fetch("/api/admin/settings").then((r) => r.json()).then((d) => setValues(d.settings));
  useEffect(load, []);

  const save = async () => {
    setStatus("saving"); setErrors({});
    const res = await fetch("/api/admin/settings", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    const d = await res.json();
    if (!res.ok) { setErrors(d.errors || {}); setStatus("error"); }
    else { setStatus("saved"); setTimeout(() => setStatus(""), 2500); }
  };

  if (!values) return <p>…</p>;
  const box = { borderColor: "var(--color-line)", background: "var(--color-paper)" };

  return (
    <div>
      <h1 className="text-xl font-bold mb-1" style={{ color: "var(--color-ink)" }}>{t("settings")}</h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-ink-soft)" }}>{t("settingsHelp")}</p>

      <div className="flex flex-col gap-5">
        {GROUPS.map((g) => (
          <div key={g.title_fr} className="rounded-xl border p-4" style={box}>
            <h2 className="font-semibold text-sm mb-3" style={{ color: "var(--color-ink)" }}>
              {lang === "ar" ? g.title_ar : g.title_fr}
            </h2>
            <div className="grid md:grid-cols-2 gap-3">
              {g.fields.map((f) => (
                <div key={f.k}>
                  <label className="text-xs block mb-1" style={{ color: "var(--color-ink-soft)" }}>
                    {lang === "ar" ? f.l_ar : f.l_fr}
                  </label>
                  <input
                    type={f.text ? "text" : "number"}
                    step={f.step || "1"}
                    value={values[f.k] ?? ""}
                    onChange={(e) => setValues({ ...values, [f.k]: e.target.value })}
                    className="w-full rounded-lg px-3 py-2 border text-sm"
                    style={{ ...box, borderColor: errors[f.k] ? "var(--color-accent)" : "var(--color-line)" }}
                    dir={f.k.endsWith("_ar") ? "rtl" : "ltr"}
                  />
                  {errors[f.k] && (
                    <p className="text-[11px] mt-1" style={{ color: "var(--color-accent)" }}>{errors[f.k]}</p>
                  )}
                </div>
              ))}
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
        {status === "error" && <span className="text-sm" style={{ color: "var(--color-accent)" }}>{t("checkFields")}</span>}
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--color-ink-soft)" }}>{t("settingsLive")}</p>
    </div>
  );
}
