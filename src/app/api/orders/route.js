import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, getBaseUrl } from "@/lib/auth";
import { createCheckout, isChargilyConfigured } from "@/lib/chargily";
import { isSofizPayConfigured, buildCibPaymentUrl } from "@/lib/sofizpay";

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

  const { fullName, phone, wilaya, address, paymentMethod, locale } = await req.json();
  if (!fullName || !phone || !wilaya || !address) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
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
      `SELECT ci.quantity, p.id as product_id, p.name_ar, p.name_fr, p.price, p.stock, p.vendor_id
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(user.id);

  if (cartItems.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  const total = cartItems.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const createOrder = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO orders (user_id, status, total, full_name, phone, wilaya, address, payment_method)
         VALUES (?, 'pending', ?, ?, ?, ?, ?, ?)`
      )
      .run(user.id, total, fullName, phone, wilaya, address, paymentMethod || "cod");

    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO order_items (order_id, product_id, vendor_id, name_ar, name_fr, price, quantity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.vendor_id || null, item.name_ar, item.name_fr, item.price, item.quantity);
      db.prepare("UPDATE products SET stock = MAX(0, stock - ?), sold_count = sold_count + ? WHERE id = ?").run(
        item.quantity,
        item.quantity,
        item.product_id
      );
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
