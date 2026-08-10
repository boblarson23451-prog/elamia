import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { itemId } = await params;
  const { quantity } = await req.json();

  const item = db.prepare("SELECT * FROM cart_items WHERE id = ? AND user_id = ?").get(itemId, user.id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (quantity <= 0) {
    db.prepare("DELETE FROM cart_items WHERE id = ?").run(itemId);
  } else {
    db.prepare("UPDATE cart_items SET quantity = ? WHERE id = ?").run(quantity, itemId);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { itemId } = await params;
  db.prepare("DELETE FROM cart_items WHERE id = ? AND user_id = ?").run(itemId, user.id);

  return NextResponse.json({ ok: true });
}
