import { NextResponse } from "next/server";
import { readImage } from "@/lib/uploads";

export const runtime = "nodejs";

/** Serves uploaded product images. Public — product photos aren't secret. */
export async function GET(req, { params }) {
  const { filename } = await params;
  const file = readImage(filename);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(file.buffer, {
    headers: {
      "Content-Type": file.contentType,
      // Filenames are content-unique, so they can be cached hard.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
