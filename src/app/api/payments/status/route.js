import { NextResponse } from "next/server";
import { isChargilyConfigured } from "@/lib/chargily";
import { isSofizPayConfigured } from "@/lib/sofizpay";
import { isCodEnabled } from "@/lib/payment-config";

export async function GET() {
  return NextResponse.json({
    chargily: isChargilyConfigured(),
    sofizpay: isSofizPayConfigured(),
    cod: isCodEnabled(),
  });
}
