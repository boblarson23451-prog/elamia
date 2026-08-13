import { NextResponse } from "next/server";
import { getSettings } from "@/lib/settings";
import { companyFrom } from "@/lib/legal-content";

/** Public: company identity for the legal pages. */
export async function GET() {
  return NextResponse.json({ company: companyFrom(getSettings()) });
}
