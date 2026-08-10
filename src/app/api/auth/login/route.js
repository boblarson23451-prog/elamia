import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const row = db.prepare("SELECT * FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (!row || !verifyPassword(password, row.password_hash)) {
    return NextResponse.json({ error: "invalid_credentials" }, { status: 401 });
  }

  const user = {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    wilaya: row.wilaya,
    role: row.role,
    created_at: row.created_at,
  };

  const token = signToken(user);
  await setSessionCookie(token);

  return NextResponse.json({ user });
}
