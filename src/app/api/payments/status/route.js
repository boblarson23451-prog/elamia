import { NextResponse } from "next/server";
import { isChargilyConfigured } from "@/lib/chargily";
import { isSofizPayConfigured } from "@/lib/sofizpay";

export async function GET() {
  return NextResponse.json({
    chargily: isChargilyConfigured(),
    sofizpay: isSofizPayConfigured(),
  });
}
