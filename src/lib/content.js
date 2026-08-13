import { db } from "./db";

/**
 * Editable site content (banners, homepage copy, legal pages).
 *
 * Anything stored here overrides the built-in translation for that key. If a
 * key has never been edited, the site falls back to the default in i18n.js —
 * so nothing goes blank just because the admin hasn't touched it yet.
 *
 * Both languages are stored separately. Editing only the French leaves the
 * Arabic on its default rather than blanking it, which matters on a site
 * where most shoppers read Arabic.
 */

/** Keys the admin may edit, grouped for the UI. */
export const EDITABLE_CONTENT = [
  {
    group_fr: "Bandeau & accueil", group_ar: "الشريط والصفحة الرئيسية",
    keys: [
      { key: "freeShippingBanner", label_fr: "Bandeau vert (haut du site)", label_ar: "الشريط الأخضر" },
      { key: "heroTitle", label_fr: "Titre principal", label_ar: "العنوان الرئيسي" },
      { key: "heroSubtitle", label_fr: "Sous-titre", label_ar: "العنوان الفرعي" },
      { key: "shopNow", label_fr: "Bouton principal", label_ar: "الزر الرئيسي" },
      { key: "tagline", label_fr: "Slogan (pied de page)", label_ar: "الشعار" },
      { key: "dealsTitle", label_fr: "Titre section promos", label_ar: "عنوان قسم العروض" },
      { key: "bestSelling", label_fr: "Titre meilleures ventes", label_ar: "عنوان الأكثر مبيعاً" },
      { key: "newArrivals", label_fr: "Titre nouveautés", label_ar: "عنوان الجديد" },
      { key: "categoriesTitle", label_fr: "Titre catégories", label_ar: "عنوان الأقسام" },
    ],
  },
  {
    group_fr: "Affiliation", group_ar: "الشراكة",
    keys: [
      { key: "affiliateIntro", label_fr: "Texte d'accroche affiliés", label_ar: "نص تعريف الشركاء", long: true },
      { key: "commissionRule", label_fr: "Règle de commission affichée", label_ar: "قاعدة العمولة", long: true },
    ],
  },
  {
    group_fr: "Vendeurs", group_ar: "البائعون",
    keys: [
      { key: "sellSubtitle", label_fr: "Texte d'accroche vendeurs", label_ar: "نص تعريف البائعين", long: true },
    ],
  },
];

const EDITABLE_KEYS = new Set(EDITABLE_CONTENT.flatMap((g) => g.keys.map((k) => k.key)));

let cache = null;

/** All overrides, as { key: { fr, ar } }. */
export function getContentOverrides() {
  if (cache) return cache;
  const rows = db.prepare("SELECT key, value_fr, value_ar FROM content").all();
  cache = Object.fromEntries(rows.map((r) => [r.key, { fr: r.value_fr, ar: r.value_ar }]));
  return cache;
}

export function saveContent(entries) {
  const up = db.prepare(
    `INSERT INTO content (key, value_fr, value_ar, updated_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value_fr = excluded.value_fr, value_ar = excluded.value_ar, updated_at = datetime('now')`
  );
  const del = db.prepare("DELETE FROM content WHERE key = ?");

  db.transaction(() => {
    for (const [key, v] of Object.entries(entries)) {
      if (!EDITABLE_KEYS.has(key)) continue; // ignore anything not on the allow-list
      const fr = (v?.fr ?? "").trim();
      const ar = (v?.ar ?? "").trim();
      // Clearing both fields restores the built-in default rather than
      // leaving the site showing empty text.
      if (!fr && !ar) del.run(key);
      else up.run(key, fr || null, ar || null);
    }
  })();

  cache = null;
  return { ok: true };
}

export function clearContentCache() { cache = null; }
