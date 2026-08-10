/**
 * Shipping engine for ELALAMIA.
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

const ZONE_MULTIPLIER = { 1: 1, 2: 1.25, 3: 1.6 };

export const CARRIERS = {
  ups: {
    id: "ups",
    label_fr: "UPS — Express",
    label_ar: "UPS — سريع",
    eta_fr: "7 à 10 jours ouvrables",
    eta_ar: "من 7 إلى 10 أيام عمل",
    baseFee: 900,      // DA, replace with your contract rate
    perKg: 320,        // DA per kg
    minWeightKg: 0.5,
  },
  ems: {
    id: "ems",
    label_fr: "EMS — Économique",
    label_ar: "EMS — اقتصادي",
    eta_fr: "15 à 45 jours ouvrables",
    eta_ar: "من 15 إلى 45 يوم عمل",
    baseFee: 450,
    perKg: 140,
    minWeightKg: 0.5,
  },
};

/** Pickup-point delivery is cheaper than door-to-door (fewer last-mile stops). */
const PICKUP_DISCOUNT_RATE = 0.25; // 25% off the computed shipping fee

/** Orders at or above this subtotal ship free (set to null to disable). */
export const FREE_SHIPPING_THRESHOLD = 15000; // DA

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
  const c = CARRIERS[carrier];
  if (!c) return null;

  if (FREE_SHIPPING_THRESHOLD != null && subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  const weightKg = Math.max(c.minWeightKg, (weightGrams || 0) / 1000);
  const zone = wilayaZone(wilaya);
  const raw = (c.baseFee + c.perKg * weightKg) * (ZONE_MULTIPLIER[zone] || 1);
  const afterDelivery = deliveryType === "pickup" ? raw * (1 - PICKUP_DISCOUNT_RATE) : raw;

  // Round up to the nearest 10 DA so totals stay tidy.
  return Math.ceil(afterDelivery / 10) * 10;
}

/** Returns both carrier options priced for a given cart, for the checkout UI. */
export function shippingQuotes({ weightGrams, wilaya, deliveryType, subtotal }) {
  return Object.values(CARRIERS).map((c) => ({
    id: c.id,
    label_fr: c.label_fr,
    label_ar: c.label_ar,
    eta_fr: c.eta_fr,
    eta_ar: c.eta_ar,
    cost: computeShipping({ weightGrams, carrier: c.id, wilaya, deliveryType, subtotal }),
  }));
}
