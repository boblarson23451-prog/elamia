import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { evaluateCustoms } from "@/lib/customs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const items = db
    .prepare(
      `SELECT ci.quantity, p.price, p.category_id,
              c.name_fr as category_name_fr, c.name_ar as category_name_ar
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       JOIN categories c ON c.id = p.category_id
       WHERE ci.user_id = ?`
    )
    .all(user.id);

  return NextResponse.json(evaluateCustoms(items));
}
