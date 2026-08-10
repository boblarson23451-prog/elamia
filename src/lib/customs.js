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

export const USD_TO_DZD = Number(process.env.CUSTOMS_USD_RATE) || 135;

export const DUTY_THRESHOLD_USD = 300;
export const DUTY_RATE = 0.30;
export const DECLARATION_THRESHOLD_USD = 500;
export const SAME_GENRE_MAX = 2; // 3+ of one genre is liable to seizure

export const RETURN_WINDOW_DAYS = 15;

export function usdToDzd(usd) {
  return Math.round(usd * USD_TO_DZD);
}

export function dzdToUsd(dzd) {
  return dzd / USD_TO_DZD;
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
    if (info.qty > SAME_GENRE_MAX) {
      blockReasons.push({
        code: "same_genre_limit",
        category_fr: info.name_fr,
        category_ar: info.name_ar,
        qty: info.qty,
        max: SAME_GENRE_MAX,
      });
    }
  }

  // Duty threshold.
  if (valueUsd > DUTY_THRESHOLD_USD) {
    estimatedDuty = Math.round(subtotalDzd * DUTY_RATE);
    warnings.push({
      code: "duty_applies",
      thresholdUsd: DUTY_THRESHOLD_USD,
      ratePct: DUTY_RATE * 100,
      estimatedDutyDzd: estimatedDuty,
    });
  }

  // Declaration threshold.
  if (valueUsd > DECLARATION_THRESHOLD_USD) {
    warnings.push({
      code: "declaration_required",
      thresholdUsd: DECLARATION_THRESHOLD_USD,
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
