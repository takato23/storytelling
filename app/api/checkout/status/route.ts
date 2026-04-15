import { NextResponse } from "next/server";
import { getCheckoutAvailability } from "@/lib/checkout-status";

export const runtime = "nodejs";

export async function GET() {
  const availability = getCheckoutAvailability();
  return NextResponse.json(availability);
}
