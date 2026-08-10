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
  const allowed = ["pending", "approved", "rejected", "suspended"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(id);
  if (!vendor) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const updateVendor = db.transaction(() => {
    db.prepare("UPDATE vendors SET status = ? WHERE id = ?").run(status, id);
    if (status === "approved") {
      db.prepare("UPDATE users SET role = 'vendor' WHERE id = ?").run(vendor.user_id);
    } else if (status === "rejected" || status === "suspended") {
      db.prepare("UPDATE users SET role = 'customer' WHERE id = ? AND role = 'vendor'").run(vendor.user_id);
    }
  });
  updateVendor();

  return NextResponse.json({ ok: true });
}
