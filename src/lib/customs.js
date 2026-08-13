/**
 * Algerian customs rules for cross-border orders.
 *
 * These encode the constraints supplied by the merchant's lawyer:
 *   • Orders over 300 USD attract a 30% duty, payable by the customer.
 *   • Orders over 500 USD require the customer to provide customs with
 *     business/tax information before release.
 *   • Three or more items "of the same genre" are liable to be SEIZED by
 *     customs. We therefore BLOCK such orders rather than merely warning:
 *     a disclaimer does not give the customer their money or goods back, and
 *     knowingly letting a customer place an order we expect to be seized is
 *     both bad business and a weak legal position.
 *
 * ⚠️ TWO THINGS YOU MUST CONFIRM BEFORE RELYING ON THIS:
 *
 * 1. USD_TO_DZD below is a CONVERSION RATE THAT CHANGES DAILY. It is set via
 *    the CUSTOMS_USD_RATE env var. If it drifts from the rate customs actually
 *    applies, orders will be allowed through that shouldn't be (or blocked
 *    that needn't be). Review it regularly, and confirm with your customs
 *    broker WHICH rate applies (official Banque d'Algérie vs. another).
 *
 * 2. "Same genre" is interpreted here as "same product category" (électronique,
 *    mode femme, etc.), and the limit is enforced as MAX 2 units per category.
 *    Customs may define "genre" more narrowly (e.g. identical article) or more
 *    broadly (e.g. all textiles). Confirm the exact definition with your
 *    lawyer/broker and adjust SAME_GENRE_MAX / the grouping key accordingly —
 *    getting this wrong means either seized shipments or lost sales.
 */

import { getSettings } from "./settings";

// All thresholds now come from the admin Settings page. Change them there,
// not here — no deploy required.
export const usdRate = () => getSettings().customs_usd_rate;
export const dutyThresholdUsd = () => getSettings().duty_threshold_usd;
export const dutyRate = () => getSettings().duty_rate;
export const declarationThresholdUsd = () => getSettings().declaration_threshold_usd;
export const sameGenreMax = () => getSettings().same_genre_max;
export const returnWindowDays = () => getSettings().return_window_days;

export function usdToDzd(usd) {
  return Math.round(usd * usdRate());
}

export function dzdToUsd(dzd) {
  return dzd / usdRate();
}

/**
 * Evaluates a cart/order against the customs rules.
 * @param {Array} items each { quantity, price, category_id, category_name_fr?, category_name_ar? }
 * @returns {{ blocked: boolean, blockReasons: Array, warnings: Array, valueUsd: number, estimatedDuty: number }}
 */
export function evaluateCustoms(items) {
  const subtotalDzd = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const valueUsd = dzdToUsd(subtotalDzd);

  const warnings = [];
  const blockReasons = [];
  let estimatedDuty = 0;

  // Same-genre quantity limit → seizure risk → hard block.
  const byCategory = new Map();
  for (const i of items) {
    const key = i.category_id ?? "unknown";
    const prev = byCategory.get(key) || { qty: 0, name_fr: i.category_name_fr, name_ar: i.category_name_ar };
    prev.qty += i.quantity;
    byCategory.set(key, prev);
  }
  for (const [, info] of byCategory) {
    if (info.qty > sameGenreMax()) {
      blockReasons.push({
        code: "same_genre_limit",
        category_fr: info.name_fr,
        category_ar: info.name_ar,
        qty: info.qty,
        max: sameGenreMax(),
      });
    }
  }

  // Duty threshold.
  if (valueUsd > dutyThresholdUsd()) {
    estimatedDuty = Math.round(subtotalDzd * dutyRate());
    warnings.push({
      code: "duty_applies",
      thresholdUsd: dutyThresholdUsd(),
      ratePct: dutyRate() * 100,
      estimatedDutyDzd: estimatedDuty,
    });
  }

  // Declaration threshold.
  if (valueUsd > declarationThresholdUsd()) {
    warnings.push({
      code: "declaration_required",
      thresholdUsd: declarationThresholdUsd(),
    });
  }

  return {
    blocked: blockReasons.length > 0,
    blockReasons,
    warnings,
    valueUsd: Math.round(valueUsd * 100) / 100,
    subtotalDzd,
    estimatedDuty,
  };
}
