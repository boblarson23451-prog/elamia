import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ vendor: null });

  const vendor = db.prepare("SELECT * FROM vendors WHERE user_id = ?").get(user.id);
  return NextResponse.json({ vendor: vendor || null });
}
