import { NextResponse } from "next/server";
import { STORIES } from "@/lib/stories";
import { createSupabaseAdminClient } from "@/lib/supabase";

function buildFallbackStories() {
  return STORIES.map((story) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    age_range: story.ages,
    target_gender: story.targetGender,
    base_price_usd: story.price,
    base_price_ars: null,
    digital_price_ars: story.digitalPriceArs,
    print_price_ars: story.printPriceArs,
    print_specs: story.printSpecs,
    cover_image: story.coverImage,
    active: true,
  }));
}

export async function GET() {
  try {
    const adminClient = createSupabaseAdminClient();
    const { data, error } = await adminClient
      .from("stories")
      .select(
        "id,slug,title,age_range,target_gender,base_price_usd,base_price_ars,digital_price_ars,print_price_ars,print_specs,cover_image,active",
      )
      .eq("active", true)
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json({ stories: buildFallbackStories(), source: "fallback" });
    }

    return NextResponse.json({ stories: data ?? [], source: "supabase" });
  } catch {
    return NextResponse.json({ stories: buildFallbackStories(), source: "fallback" });
  }
}
