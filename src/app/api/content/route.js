import { NextResponse } from "next/server";
import { getContentOverrides } from "@/lib/content";

/** Public: the site fetches these once and merges them over the defaults. */
export async function GET() {
  return NextResponse.json({ overrides: getContentOverrides() });
}
