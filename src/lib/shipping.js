import { getSettings } from "./settings";

/**
 * Shipping engine for ELALAMIA.
 *
 * Rates now come from the admin Settings page (database), not this file.
 * The values below are only fallbacks for a fresh install.
 *
 * Pricing model: a per-carrier base fee + a per-kilogram rate, multiplied by
 * a zone factor (shipping to the far south of Algeria genuinely costs more
 * than the coastal north), then optionally discounted for pickup-point
 * delivery instead of door-to-door.
 *
 * IMPORTANT: the rates below are PLACEHOLDERS chosen to be plausible, not
 * quotes from UPS or EMS. Replace them with your negotiated contract rates
 * before going live — see CARRIERS below. Same for FREE_SHIPPING_THRESHOLD.
 */

/** Delivery zones. Zone 1 = north/coastal, 2 = highlands, 3 = deep south. */
const ZONE_3 = new Set([
  "01", "08", "11", "30", "32", "33", "37", "39", "45", "47", "49", "50",
  "51", "52", "53", "54", "55", "56", "57", "58",
]);
const ZONE_2 = new Set([
  "03", "04", "05", "07", "12", "14", "17", "20", "26", "28", "34", "38", "40", "41", "44", "48",
]);

export function wilayaZone(wilaya) {
  const code = String(wilaya || "").trim().slice(0, 2);
  if (ZONE_3.has(code)) return 3;
  if (ZONE_2.has(code)) return 2;
  return 1;
}



/** Carrier definitions, priced from live settings. */
export function getCarriers() {
  const s = getSettings();
  return {
    ups: {
      id: "ups",
      label_fr: "UPS — Express",
      label_ar: "UPS — سريع",
      eta_fr: s.ups_eta_fr,
      eta_ar: s.ups_eta_ar,
      baseFee: s.ups_base_fee,
      perKg: s.ups_per_kg,
      minWeightKg: 0.5,
    },
    ems: {
      id: "ems",
      label_fr: "EMS — Économique",
      label_ar: "EMS — اقتصادي",
      eta_fr: s.ems_eta_fr,
      eta_ar: s.ems_eta_ar,
      baseFee: s.ems_base_fee,
      perKg: s.ems_per_kg,
      minWeightKg: 0.5,
    },
  };
}

/** Back-compat: existing imports of CARRIERS still work. */
export const CARRIERS = new Proxy({}, {
  get: (_, k) => getCarriers()[k],
  has: (_, k) => k in getCarriers(),
  ownKeys: () => Reflect.ownKeys(getCarriers()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

/** Pickup-point delivery is cheaper than door-to-door (fewer last-mile stops). */


/** Orders at or above this subtotal ship free (0 disables). */
export function freeShippingThreshold() {
  return getSettings().free_shipping_threshold;
}

export const DEFAULT_ITEM_WEIGHT_GRAMS = 500;

/** Sums the billable weight of a cart/order in grams. */
export function totalWeightGrams(items) {
  return items.reduce(
    (sum, i) => sum + (i.weight_grams ?? DEFAULT_ITEM_WEIGHT_GRAMS) * i.quantity,
    0
  );
}

/**
 * Computes the shipping cost in DA (integer).
 * @param {object} opts
 * @param {number} opts.weightGrams total billable weight
 * @param {string} opts.carrier 'ups' | 'ems'
 * @param {string} opts.wilaya e.g. "13 - Tlemcen"
 * @param {string} opts.deliveryType 'home' | 'pickup'
 * @param {number} opts.subtotal order subtotal, for the free-shipping threshold
 */
export function computeShipping({ weightGrams, carrier, wilaya, deliveryType, subtotal }) {
  const settings = getSettings();
  const c = getCarriers()[carrier];
  if (!c) return null;

  const threshold = settings.free_shipping_threshold;
  if (threshold > 0 && subtotal >= threshold) return 0;

  const zoneMultiplier = { 1: 1, 2: settings.zone2_multiplier, 3: settings.zone3_multiplier };
  const weightKg = Math.max(c.minWeightKg, (weightGrams || 0) / 1000);
  const zone = wilayaZone(wilaya);
  const raw = (c.baseFee + c.perKg * weightKg) * (zoneMultiplier[zone] || 1);
  const afterDelivery = deliveryType === "pickup" ? raw * (1 - settings.pickup_discount_rate) : raw;

  // Round up to the nearest 10 DA so totals stay tidy.
  return Math.ceil(afterDelivery / 10) * 10;
}

/** Returns both carrier options priced for a given cart, for the checkout UI. */
export function shippingQuotes({ weightGrams, wilaya, deliveryType, subtotal }) {
  return Object.values(getCarriers()).map((c) => ({
    id: c.id,
    label_fr: c.label_fr,
    label_ar: c.label_ar,
    eta_fr: c.eta_fr,
    eta_ar: c.eta_ar,
    cost: computeShipping({ weightGrams, carrier: c.id, wilaya, deliveryType, subtotal }),
  }));
}
