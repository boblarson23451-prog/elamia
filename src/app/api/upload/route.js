import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveImage, MAX_UPLOAD_BYTES } from "@/lib/uploads";

export const runtime = "nodejs";

/** Image upload for admins and approved vendors only. */
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let allowed = user.role === "admin";
  if (!allowed) {
    const vendor = db.prepare("SELECT status FROM vendors WHERE user_id = ?").get(user.id);
    allowed = vendor?.status === "approved";
  }
  if (!allowed) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "invalid_form" }, { status: 400 });
  }

  const files = form.getAll("files").filter((f) => typeof f?.arrayBuffer === "function");
  if (files.length === 0) return NextResponse.json({ error: "no_files" }, { status: 400 });
  if (files.length > 10) return NextResponse.json({ error: "too_many_files" }, { status: 400 });

  const urls = [];
  const errors = [];
  for (const file of files) {
    if (file.size > MAX_UPLOAD_BYTES) {
      errors.push({ name: file.name, error: "file_too_large" });
      continue;
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const res = saveImage(buf, file.type);
    if (res.ok) urls.push(res.url);
    else errors.push({ name: file.name, error: res.error });
  }

  return NextResponse.json({ urls, errors });
}
