import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";
import { AdminFxRateRequestSchema } from "@/lib/types";

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") ?? "30");
    const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 90) : 30;

    const { data, error } = await adminClient
      .from("fx_rates_daily")
      .select("date,usd_to_ars,created_by,created_at,updated_at")
      .order("date", { ascending: false })
      .limit(safeLimit);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ fx_rates: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdminUser();
    const payload = AdminFxRateRequestSchema.parse(await request.json());
    const adminClient = createSupabaseAdminClient();

    const { data, error } = await adminClient
      .from("fx_rates_daily")
      .upsert(
        {
          date: payload.date,
          usd_to_ars: payload.usd_to_ars,
          created_by: user.id,
        },
        { onConflict: "date" },
      )
      .select("date, usd_to_ars, created_by, created_at")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to save FX rate");
    }

    return NextResponse.json({ fx_rate: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
