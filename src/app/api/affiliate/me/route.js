import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getAffiliateByUser, affiliateStats } from "@/lib/affiliate";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ affiliate: null });

  const affiliate = getAffiliateByUser(user.id);
  if (!affiliate) return NextResponse.json({ affiliate: null });

  const stats = affiliate.status === "approved" ? affiliateStats(affiliate.id) : null;

  const commissions = db.prepare(
    `SELECT ac.*, o.status as order_status, o.created_at as order_date
     FROM affiliate_commissions ac
     JOIN orders o ON o.id = ac.order_id
     WHERE ac.affiliate_id = ?
     ORDER BY ac.created_at DESC LIMIT 50`
  ).all(affiliate.id);

  return NextResponse.json({ affiliate, stats, commissions });
}
