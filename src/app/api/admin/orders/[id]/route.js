import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const { id } = await params;
  const { status } = await req.json();
  const allowed = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, id);

  return NextResponse.json({ ok: true });
}
