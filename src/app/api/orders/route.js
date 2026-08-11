import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getBaseUrl } from "@/lib/auth";
import { createCheckout, isChargilyConfigured } from "@/lib/chargily";
import { isSofizPayConfigured, buildCibPaymentUrl } from "@/lib/sofizpay";
import { computeShipping, totalWeightGrams, CARRIERS } from "@/lib/shipping";
import { getPickupPointById } from "@/lib/pickup-points";
import { evaluateCustoms } from "@/lib/customs";
import { variantLabel } from "@/lib/variants";
import { isCodEnabled } from "@/lib/payment-config";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const orders = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(user.id);

  return NextResponse.json({ orders });
}

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const {
    fullName, phone, wilaya, address, paymentMethod, locale,
    shippingCarrier, deliveryType = "home", pickupPointId,
  } = await req.json();

  // For pickup delivery the street address isn't required — the pickup point is.
  const needsAddress = deliveryType !== "pickup";
  if (!fullName || !phone || !wilaya || (needsAddress && !address)) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!CARRIERS[shippingCarrier]) {
    return NextResponse.json({ error: "invalid_carrier" }, { status: 400 });
  }

  let pickupPoint = null;
  if (deliveryType === "pickup") {
    pickupPoint = getPickupPointById(pickupPointId);
    if (!pickupPoint) {
      return NextResponse.json({ error: "invalid_pickup_point" }, { status: 400 });
    }
    // Guard against a pickup point in a different wilaya than the one selected.
    if (pickupPoint.wilaya_code !== String(wilaya).trim().slice(0, 2)) {
      return NextResponse.json({ error: "pickup_point_wilaya_mismatch" }, { status: 400 });
    }
  }

  if (paymentMethod === "cod" && !isCodEnabled()) {
    return NextResponse.json({ error: "cod_disabled" }, { status: 400 });
  }

  const wantsOnlinePayment = paymentMethod === "chargily" || paymentMethod === "sofizpay";
  if (paymentMethod === "chargily" && !isChargilyConfigured()) {
    return NextResponse.json({ error: "chargily_not_configured" }, { status: 400 });
  }
  if (paymentMethod === "sofizpay" && !isSofizPayConfigured()) {
    return NextResponse.json({ error: "sofizpay_not_configured" }, { status: 400 });
  }

  const cartItems = db
    .prepare(
      `SELECT ci.quantity, ci.variant_id,
              p.id as product_id, p.name_ar, p.name_fr, p.vendor_id,
              COALESCE(v.price, p.price) as price,
              COALESCE(v.stock, p.stock) as stock,
              COALESCE(v.weight_grams, p.weight_grams) as weight_grams,
              v.v1_fr, v.v1_ar, v.v2_fr, v.v2_ar
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       LEFT JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = ?`
    )
    .all(user.id);

  // Customs rules: block orders we expect customs to seize, rather than
  // taking the money and disclaiming the loss afterwards.
  const customsItems = db
    .prepare(
      `SELECT ci.quantity, COALESCE(v.price, p.price) as price, p.category_id,
              c.name_fr as category_name_fr, c.name_ar as category_name_ar
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN product_variants v ON v.id = ci.variant_id
       WHERE ci.user_id = ?`
    )
    .all(user.id);
  const customs = evaluateCustoms(customsItems);
  if (customs.blocked) {
    return NextResponse.json(
      { error: "customs_blocked", blockReasons: customs.blockReasons },
      { status: 400 }
    );
  }

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const subtotal = cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

  // Shipping is always recomputed server-side — never trust a client-sent price.
  const weightGrams = totalWeightGrams(cartItems);
  const shippingCost = computeShipping({
    weightGrams,
    carrier: shippingCarrier,
    wilaya,
    deliveryType,
    subtotal,
  });
  if (shippingCost == null) {
    return NextResponse.json({ error: "shipping_unavailable" }, { status: 400 });
  }

  const total = subtotal + shippingCost;

  const createOrder = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO orders
           (user_id, status, subtotal, shipping_cost, total, full_name, phone, wilaya, address,
            payment_method, shipping_carrier, delivery_type, pickup_point_id)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        user.id, subtotal, shippingCost, total, fullName, phone, wilaya,
        deliveryType === "pickup" ? (pickupPoint.address_fr || "") : address,
        paymentMethod || "cod", shippingCarrier, deliveryType,
        deliveryType === "pickup" ? pickupPoint.id : null
      );

    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items
         (order_id, product_id, vendor_id, variant_id, variant_label_fr, variant_label_ar, name_ar, name_fr, price, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of cartItems) {
      // Snapshot the variant label onto the order line: if the variant is
      // later renamed or deleted, the historical order still says what was
      // actually sold.
      insertItem.run(
        orderId, item.product_id, item.vendor_id || null, item.variant_id || null,
        variantLabel(item, "fr"), variantLabel(item, "ar"),
        item.name_ar, item.name_fr, item.price, item.quantity
      );

      if (item.variant_id) {
        db.prepare("UPDATE product_variants SET stock = MAX(0, stock - ?) WHERE id = ?").run(item.quantity, item.variant_id);
        db.prepare("UPDATE products SET sold_count = sold_count + ? WHERE id = ?").run(item.quantity, item.product_id);
      } else {
        db.prepare("UPDATE products SET stock = MAX(0, stock - ?), sold_count = sold_count + ? WHERE id = ?").run(
          item.quantity, item.quantity, item.product_id
        );
      }
    }

    db.prepare("DELETE FROM cart_items WHERE user_id = ?").run(user.id);

    return orderId;
  });

  const orderId = createOrder();

  if (!wantsOnlinePayment) {
    return NextResponse.json({ orderId });
  }

  // Online payment: create the hosted checkout now that the order exists.
  // If this fails (network hiccup, etc.), the order still stands — the person
  // can retry payment from their order page rather than losing the order.
  const baseUrl = getBaseUrl(req);

  if (paymentMethod === "chargily") {
    try {
      const { checkoutId, checkoutUrl } = await createCheckout({
        amount: total,
        orderId,
        baseUrl,
        locale: locale === "fr" ? "fr" : "ar",
      });
      db.prepare("UPDATE orders SET chargily_checkout_id = ? WHERE id = ?").run(checkoutId, orderId);
      return NextResponse.json({ orderId, checkoutUrl });
    } catch {
      return NextResponse.json({ orderId, checkoutError: true });
    }
  }

  if (paymentMethod === "sofizpay") {
    try {
      const paymentUrl = buildCibPaymentUrl({
        amount: total,
        orderId,
        fullName,
        phone,
        email: user.email,
        baseUrl,
        locale: locale === "fr" ? "fr" : "ar",
      });
      return NextResponse.json({ orderId, checkoutUrl: paymentUrl });
    } catch {
      return NextResponse.json({ orderId, checkoutError: true });
    }
  }

  return NextResponse.json({ orderId });
}
