/**
 * Cash on Delivery toggle.
 *
 * Set COD_ENABLED=false (env var) to remove Cash on Delivery from checkout
 * entirely. Enforced on BOTH the checkout UI and the server-side order
 * route, so disabling it can't be bypassed by crafting a request by hand.
 *
 * NOTE: this is a function, not a constant, deliberately. Next.js can inline
 * `process.env.X` constants at build time, which would mean flipping the env
 * var on the host had no effect until a rebuild. Reading it inside a function
 * keeps it a true runtime switch.
 *
 * ⚠️ Do not disable this until an online payment gateway is actually working
 * end-to-end. With COD off and no working gateway, customers cannot place
 * any orders at all.
 */
export function isCodEnabled() {
  // Cash on Delivery is DISABLED by default at the merchant's request.
  // Set COD_ENABLED=true to bring it back.
  //
  // ⚠️ With COD off, customers can only pay through an online gateway. If no
  // gateway is configured and working, NO ONE CAN PLACE AN ORDER — checkout
  // will show "no payment method available".
  return process.env.COD_ENABLED === "true";
}
