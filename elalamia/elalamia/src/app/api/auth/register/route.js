import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, signToken, setSessionCookie } from "@/lib/auth";

export async function POST(req) {
  const { name, email, password, wilaya, phone } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase().trim());
  if (existing) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = hashPassword(password);
  const info = db
    .prepare("INSERT INTO users (name, email, password_hash, wilaya, phone, role) VALUES (?, ?, ?, ?, ?, 'customer')")
    .run(name.trim(), email.toLowerCase().trim(), passwordHash, wilaya || null, phone || null);

  const user = db
    .prepare("SELECT id, name, email, phone, wilaya, role, created_at FROM users WHERE id = ?")
    .get(info.lastInsertRowid);

  const token = signToken(user);
  await setSessionCookie(token);

  return NextResponse.json({ user });
}
