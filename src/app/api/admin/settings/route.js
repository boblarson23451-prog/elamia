import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getSettings, saveSettings, DEFAULTS } from "@/lib/settings";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  return NextResponse.json({ settings: getSettings(), defaults: DEFAULTS });
}

export async function PUT(req) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const body = await req.json();
  const res = saveSettings(body.settings || {});
  if (!res.ok) return NextResponse.json({ error: "validation", errors: res.errors }, { status: 400 });
  return NextResponse.json({ ok: true, settings: getSettings() });
}
