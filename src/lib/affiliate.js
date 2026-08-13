import { db } from "./db";
import { getSettings } from "./settings";

/**
 * Affiliate programme.
 *
 * Attribution model: last-click, stored in a first-party cookie for
 * ATTRIBUTION_DAYS. The cookie is read at checkout and the affiliate is
 * stamped onto the order.
 *
 * Commission is earned when an order reaches "delivered" — NOT when it is
 * placed. With cash-on-delivery a meaningful share of orders are refused at
 * the door or returned; paying on placement would leave the business paying
 * commission on merchandise it never sold. Commission is reversed if a
 * delivered order is later cancelled.
 *
 * Commission is calculated on the SUBTOTAL, excluding shipping — you don't
 * earn margin on delivery fees, so you shouldn't pay commission on them.
 */

export const attributionDays = () => getSettings().attribution_days;
export const ATTRIBUTION_DAYS = 30; // fallback for cookie maxAge at import time
export const AFFILIATE_COOKIE = "elalamia_ref";
export const defaultCommissionRate = () => getSettings().default_commission_rate;
export const DEFAULT_COMMISSION_RATE = 0.05;

/** Generates a short, unambiguous referral code (no 0/O/1/I confusion). */
export function generateCode(seed = "") {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const base = String(seed).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || "REF";
  let suffix = "";
  for (let i = 0; i < 4; i++) suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `${base}${suffix}`;
}

export function getAffiliateByCode(code) {
  if (!code) return null;
  return db
    .prepare("SELECT * FROM affiliates WHERE code = ? AND status = 'approved'")
    .get(String(code).toUpperCase().trim());
}

export function getAffiliateByUser(userId) {
  return db.prepare("SELECT * FROM affiliates WHERE user_id = ?").get(userId);
}

export function recordClick(affiliateId, landingPath) {
  db.prepare("INSERT INTO affiliate_clicks (affiliate_id, landing_path) VALUES (?, ?)")
    .run(affiliateId, landingPath || null);
}

/**
 * Creates a pending commission for an order.
 * Self-referral is rejected: an affiliate ordering through their own link
 * would be a straight discount funded by the business.
 */
export function createCommission(orderId, affiliateId, subtotal, buyerUserId) {
  const aff = db.prepare("SELECT * FROM affiliates WHERE id = ? AND status = 'approved'").get(affiliateId);
  if (!aff) return null;
  if (buyerUserId && aff.user_id === buyerUserId) return null;

  const amount = Math.round(subtotal * aff.commission_rate);
  try {
    db.prepare(
      `INSERT INTO affiliate_commissions (affiliate_id, order_id, order_subtotal, rate, amount, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`
    ).run(affiliateId, orderId, subtotal, aff.commission_rate, amount);
    return amount;
  } catch {
    return null; // UNIQUE(order_id) — already recorded
  }
}

/** Moves commissions in step with order status. Called whenever status changes. */
export function syncCommissionForOrder(orderId, orderStatus) {
  const c = db.prepare("SELECT * FROM affiliate_commissions WHERE order_id = ?").get(orderId);
  if (!c) return;

  if (orderStatus === "delivered" && c.status === "pending") {
    db.prepare("UPDATE affiliate_commissions SET status = 'approved' WHERE id = ?").run(c.id);
  } else if (orderStatus === "cancelled" && c.status !== "paid") {
    db.prepare("UPDATE affiliate_commissions SET status = 'cancelled' WHERE id = ?").run(c.id);
  } else if (orderStatus !== "delivered" && c.status === "approved") {
    // Status walked back from delivered — un-approve rather than pay out.
    db.prepare("UPDATE affiliate_commissions SET status = 'pending' WHERE id = ?").run(c.id);
  }
}

/** Dashboard totals for one affiliate. */
export function affiliateStats(affiliateId) {
  const clicks = db
    .prepare("SELECT COUNT(*) c FROM affiliate_clicks WHERE affiliate_id = ?")
    .get(affiliateId).c;

  const rows = db
    .prepare(
      `SELECT status, COUNT(*) as n, COALESCE(SUM(amount),0) as total
       FROM affiliate_commissions WHERE affiliate_id = ? GROUP BY status`
    )
    .all(affiliateId);

  const by = Object.fromEntries(rows.map((r) => [r.status, { n: r.n, total: r.total }]));
  const orders = rows.reduce((s, r) => s + r.n, 0);

  return {
    clicks,
    orders,
    pending: by.pending?.total || 0,
    approved: by.approved?.total || 0,
    paid: by.paid?.total || 0,
    cancelled: by.cancelled?.total || 0,
    conversionRate: clicks > 0 ? Math.round((orders / clicks) * 1000) / 10 : 0,
  };
}
