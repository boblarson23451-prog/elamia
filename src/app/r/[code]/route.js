import { NextResponse } from "next/server";
import { getAffiliateByCode, recordClick, AFFILIATE_COOKIE, ATTRIBUTION_DAYS } from "@/lib/affiliate";

/**
 * Referral entry point: /r/CODE?to=/products/xyz
 * Sets the attribution cookie, logs the click, then redirects to the shop.
 */
export async function GET(req, { params }) {
  const { code } = await params;
  const { searchParams, origin } = new URL(req.url);

  // Only allow same-site destinations — an open redirect here would let
  // someone use your domain to bounce people to a phishing page.
  const raw = searchParams.get("to") || "/";
  const to = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const affiliate = getAffiliateByCode(code);
  const res = NextResponse.redirect(new URL(to, origin));

  if (affiliate) {
    try { recordClick(affiliate.id, to); } catch {}
    res.cookies.set(AFFILIATE_COOKIE, affiliate.code, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * ATTRIBUTION_DAYS,
    });
  }
  return res;
}
