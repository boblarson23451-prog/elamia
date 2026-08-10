import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
  } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const vendors = db
    .prepare(
      `SELECT v.*, u.name as user_name, u.email as user_email
       FROM vendors v JOIN users u ON u.id = v.user_id
       ORDER BY v.created_at DESC`
    )
    .all();

  return NextResponse.json({ vendors });
}
