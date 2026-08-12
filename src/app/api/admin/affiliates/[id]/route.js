import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req, { params }) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;
  const { status, commission_rate, markPaid } = await req.json();

  if (status) {
    const allowed = ["pending", "approved", "rejected", "suspended"];
    if (!allowed.includes(status)) return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    db.prepare("UPDATE affiliates SET status = ? WHERE id = ?").run(status, id);
  }

  if (commission_rate != null) {
    const rate = Number(commission_rate);
    // Guard against a typo turning 5% into 500% and bankrupting a payout run.
    if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) {
      return NextResponse.json({ error: "invalid_rate" }, { status: 400 });
    }
    db.prepare("UPDATE affiliates SET commission_rate = ? WHERE id = ?").run(rate, id);
  }

  if (markPaid) {
    db.prepare(
      "UPDATE affiliate_commissions SET status = 'paid', paid_at = datetime('now') WHERE affiliate_id = ? AND status = 'approved'"
    ).run(id);
  }

  return NextResponse.json({ ok: true });
}
