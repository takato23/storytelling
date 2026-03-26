import { NextResponse } from "next/server";
import { storyMocks } from "@/lib/site-content";

function buildLocalStories() {
  return storyMocks.map((story) => ({
    id: story.id,
    slug: story.slug,
    title: story.title,
    short_description: story.shortDescription,
    full_description: story.fullDescription,
    age_range: story.ages,
    target_gender: story.targetGender,
    base_price_usd: story.price,
    base_price_ars: null,
    digital_price_ars: story.digitalPriceArs,
    print_price_ars: story.printPriceArs,
    print_specs: story.printSpecs,
    cover_image: story.coverImage,
    preview_images: story.previewImages,
    mock_status: story.mockStatus,
    mock_label: story.mockLabel,
    price_display: story.priceDisplay,
    format_availability: story.formatAvailability,
    cta_mode: story.ctaMode,
    purchase_note: story.purchaseNote,
    preview_promise: story.previewPromise,
    active: true,
  }));
}

export async function GET() {
  return NextResponse.json({
    stories: buildLocalStories(),
    source: "local",
  });
}
