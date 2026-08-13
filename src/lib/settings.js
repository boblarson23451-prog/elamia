import { db } from "./db";

/**
 * Editable settings, stored in the database so the admin can change business
 * rules without a code deploy.
 *
 * DEFAULTS below are the fallback: if a key has never been saved, the default
 * applies. That means adding a new setting here is safe — existing sites keep
 * working until someone changes it.
 *
 * Values are validated on save (see validateSetting) because these numbers
 * move real money: a mistyped commission rate or a zeroed shipping fee would
 * silently cost the business on every order.
 */

export const DEFAULTS = {
  // Shipping — per carrier
  ups_base_fee: 900,
  ups_per_kg: 320,
  ups_eta_fr: "7 à 10 jours ouvrables",
  ups_eta_ar: "من 7 إلى 10 أيام عمل",
  ems_base_fee: 450,
  ems_per_kg: 140,
  ems_eta_fr: "15 à 45 jours ouvrables",
  ems_eta_ar: "من 15 إلى 45 يوم عمل",

  // Zone multipliers (1 = north/coastal, 2 = highlands, 3 = deep south)
  zone2_multiplier: 1.25,
  zone3_multiplier: 1.6,

  pickup_discount_rate: 0.25,
  free_shipping_threshold: 15000,

  // Customs
  customs_usd_rate: 135,
  duty_threshold_usd: 300,
  duty_rate: 0.30,
  declaration_threshold_usd: 500,
  same_genre_max: 2,

  // Affiliate
  default_commission_rate: 0.05,
  attribution_days: 30,
  affiliate_payout_terms_fr: "",
  affiliate_payout_terms_ar: "",

  // Returns
  return_window_days: 15,
};

/** Rules that keep a typo from becoming an expensive mistake. */
const RULES = {
  ups_base_fee: { min: 0, max: 100000, int: true },
  ups_per_kg: { min: 0, max: 100000, int: true },
  ems_base_fee: { min: 0, max: 100000, int: true },
  ems_per_kg: { min: 0, max: 100000, int: true },
  zone2_multiplier: { min: 1, max: 10 },
  zone3_multiplier: { min: 1, max: 10 },
  pickup_discount_rate: { min: 0, max: 0.9 },
  free_shipping_threshold: { min: 0, max: 10000000, int: true },
  customs_usd_rate: { min: 1, max: 100000 },
  duty_threshold_usd: { min: 0, max: 1000000, int: true },
  duty_rate: { min: 0, max: 1 },
  declaration_threshold_usd: { min: 0, max: 1000000, int: true },
  same_genre_max: { min: 1, max: 100, int: true },
  default_commission_rate: { min: 0, max: 0.5 },
  attribution_days: { min: 1, max: 365, int: true },
  return_window_days: { min: 0, max: 365, int: true },
};

let cache = null;

export function getSettings() {
  if (cache) return cache;
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const out = { ...DEFAULTS };
  for (const [k, v] of Object.entries(stored)) {
    if (!(k in DEFAULTS)) continue;
    out[k] = typeof DEFAULTS[k] === "number" ? Number(v) : v;
  }
  cache = out;
  return out;
}

export function getSetting(key) {
  return getSettings()[key];
}

export function validateSetting(key, value) {
  if (!(key in DEFAULTS)) return { ok: false, error: "unknown_key" };
  if (typeof DEFAULTS[key] !== "number") return { ok: true, value: String(value) };

  const n = Number(value);
  if (!Number.isFinite(n)) return { ok: false, error: "not_a_number" };
  const r = RULES[key];
  if (r) {
    if (n < r.min || n > r.max) return { ok: false, error: `out_of_range_${r.min}_${r.max}` };
    if (r.int && !Number.isInteger(n)) return { ok: false, error: "must_be_integer" };
  }
  return { ok: true, value: String(n) };
}

export function saveSettings(updates) {
  const errors = {};
  const valid = [];

  for (const [k, v] of Object.entries(updates)) {
    const res = validateSetting(k, v);
    if (!res.ok) errors[k] = res.error;
    else valid.push([k, res.value]);
  }
  // Reject the whole batch if anything is invalid, so you never end up with
  // half-applied pricing.
  if (Object.keys(errors).length > 0) return { ok: false, errors };

  const up = db.prepare(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
  );
  db.transaction(() => { for (const [k, v] of valid) up.run(k, v); })();

  cache = null; // force reload
  return { ok: true };
}

export function clearSettingsCache() { cache = null; }
