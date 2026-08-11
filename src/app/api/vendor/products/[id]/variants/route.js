import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireVendor } from "@/lib/auth";
import { replaceVariants } from "@/lib/variants";

/** Vendors may only touch variants on their own products. */
function ownedOr404(id, vendorId) {
  const p = db.prepare("SELECT id, vendor_id FROM products WHERE id = ?").get(id);
  if (!p || p.vendor_id !== vendorId) return null;
  return p;
}

export async function GET(req, { params }) {
  let vendor;
  try { ({ vendor } = await requireVendor()); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;
  if (!ownedOr404(id, vendor.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const options = db
    .prepare("SELECT option1_name_fr, option1_name_ar, option2_name_fr, option2_name_ar FROM products WHERE id = ?")
    .get(id);
  const variants = db
    .prepare("SELECT * FROM product_variants WHERE product_id = ? ORDER BY position ASC, id ASC")
    .all(id);
  return NextResponse.json({ variants, options: options || {} });
}

export async function PUT(req, { params }) {
  let vendor;
  try { ({ vendor } = await requireVendor()); } catch (e) {
    return NextResponse.json({ error: "unauthorized" }, { status: e.status || 401 });
  }
  const { id } = await params;
  if (!ownedOr404(id, vendor.id)) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { variants, option1_name_fr, option1_name_ar, option2_name_fr, option2_name_ar } = await req.json();
  db.prepare(
    "UPDATE products SET option1_name_fr = ?, option1_name_ar = ?, option2_name_fr = ?, option2_name_ar = ? WHERE id = ?"
  ).run(option1_name_fr || null, option1_name_ar || null, option2_name_fr || null, option2_name_ar || null, id);
  replaceVariants(id, variants);
  return NextResponse.json({ ok: true, count: (variants || []).length });
}
