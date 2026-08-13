import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getContentOverrides, saveContent, EDITABLE_CONTENT } from "@/lib/content";
import { DICT } from "@/lib/i18n";

export async function GET() {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const overrides = getContentOverrides();
  // Send the built-in defaults too, so the editor can show what the text
  // currently is even when it's never been customised.
  const defaults = {};
  for (const g of EDITABLE_CONTENT) {
    for (const k of g.keys) {
      defaults[k.key] = { fr: DICT.fr[k.key] || "", ar: DICT.ar[k.key] || "" };
    }
  }
  return NextResponse.json({ overrides, defaults, schema: EDITABLE_CONTENT });
}

export async function PUT(req) {
  try { await requireAdmin(); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { entries } = await req.json();
  saveContent(entries || {});
  return NextResponse.json({ ok: true, overrides: getContentOverrides() });
}
