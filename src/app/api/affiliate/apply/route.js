import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { generateCode, DEFAULT_COMMISSION_RATE } from "@/lib/affiliate";

export async function POST(req) {
  let user;
  try { user = await requireUser(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }

  const existing = db.prepare("SELECT * FROM affiliates WHERE user_id = ?").get(user.id);
  if (existing) return NextResponse.json({ error: "already_applied", affiliate: existing }, { status: 409 });

  const { phone, audience, payout_method, payout_details } = await req.json();

  let code = generateCode(user.name);
  for (let i = 0; i < 20 && db.prepare("SELECT id FROM affiliates WHERE code = ?").get(code); i++) {
    code = generateCode(user.name);
  }

  const info = db.prepare(
    `INSERT INTO affiliates (user_id, code, status, commission_rate, phone, audience, payout_method, payout_details)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`
  ).run(user.id, code, DEFAULT_COMMISSION_RATE, phone || null, audience || null, payout_method || null, payout_details || null);

  return NextResponse.json({ affiliate: db.prepare("SELECT * FROM affiliates WHERE id = ?").get(info.lastInsertRowid) });
}
