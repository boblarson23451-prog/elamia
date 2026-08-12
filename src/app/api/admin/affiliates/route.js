import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const affiliates = db.prepare(
    `SELECT a.*, u.name as user_name, u.email as user_email,
            (SELECT COUNT(*) FROM affiliate_clicks c WHERE c.affiliate_id = a.id) as clicks,
            (SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status = 'approved') as owed,
            (SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions ac WHERE ac.affiliate_id = a.id AND ac.status = 'paid') as paid
     FROM affiliates a JOIN users u ON u.id = a.user_id
     ORDER BY a.created_at DESC`
  ).all();

  return NextResponse.json({ affiliates });
}
