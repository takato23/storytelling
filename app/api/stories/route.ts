import { NextResponse } from "next/server";
import { STORIES } from "@/lib/stories";
import { findStoryMockByIdOrSlug } from "@/lib/site-content";

function buildLocalStories() {
  return STORIES.map((story) => {
    const storyMock = findStoryMockByIdOrSlug(story.id);
    if (!storyMock) {
      return {
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
        mock_status: "example",
        mock_label: "Catálogo activo",
        price_display: {
          digital: `Versión digital desde ARS ${story.digitalPriceArs.toLocaleString('es-AR')}`,
          print: `Libro físico desde ARS ${story.printPriceArs.toLocaleString('es-AR')}`,
        },
        format_availability: ["digital", "print"],
        cta_mode: "direct_personalization",
        purchase_note: "Libro activo para personalización real.",
        preview_promise: "Preview real con portada y escenas antes de pagar.",
        active: true,
      };
    }

    return ({
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
    mock_status: storyMock.mockStatus,
    mock_label: storyMock.mockLabel,
    price_display: storyMock.priceDisplay,
    format_availability: storyMock.formatAvailability,
    cta_mode: storyMock.ctaMode,
    purchase_note: storyMock.purchaseNote,
    preview_promise: storyMock.previewPromise,
    active: true,
    });
  });
}

export async function GET() {
  return NextResponse.json({
    stories: buildLocalStories(),
    source: "local",
  });
}
