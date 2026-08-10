import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { shippingQuotes, totalWeightGrams } from "@/lib/shipping";
import { getPickupPointsForWilaya } from "@/lib/pickup-points";

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { wilaya, deliveryType = "home" } = await req.json();

  const items = db
    .prepare(
      `SELECT ci.quantity, p.price, p.weight_grams
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?`
    )
    .all(user.id);

  if (items.length === 0) {
    return NextResponse.json({ quotes: [], pickupPoints: [], weightGrams: 0, subtotal: 0 });
  }

  const weightGrams = totalWeightGrams(items);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return NextResponse.json({
    weightGrams,
    subtotal,
    quotes: shippingQuotes({ weightGrams, wilaya, deliveryType, subtotal }),
    pickupPoints: getPickupPointsForWilaya(wilaya),
  });
}
