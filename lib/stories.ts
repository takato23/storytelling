import { storyMocks, findStoryMockByIdOrSlug, type StoryMockContent } from "@/lib/site-content"

type StoryMockOnlyFields =
  | "mockStatus"
  | "mockLabel"
  | "priceDisplay"
  | "formatAvailability"
  | "ctaMode"
  | "purchaseNote"
  | "previewPromise"

export type Story = Omit<StoryMockContent, StoryMockOnlyFields>

function toStory(story: StoryMockContent): Story {
  return {
    id: story.id,
    slug: story.slug,
    title: story.title,
    shortDescription: story.shortDescription,
    fullDescription: story.fullDescription,
    coverColor: story.coverColor,
    style: story.style,
    ages: story.ages,
    pages: story.pages,
    price: story.price,
    targetGender: story.targetGender,
    digitalPriceArs: story.digitalPriceArs,
    printPriceArs: story.printPriceArs,
    printSpecs: story.printSpecs,
    icon: story.icon,
    coverImage: story.coverImage,
    previewImages: story.previewImages,
    themes: story.themes,
    specs: story.specs,
    reviews: story.reviews,
    educational: story.educational,
  }
}

export const STORIES: Story[] = storyMocks.map(toStory)

export function findStoryByIdOrSlug(value: string | null | undefined): Story | null {
  const storyMock = findStoryMockByIdOrSlug(value)
  if (!storyMock) return null
  return toStory(storyMock)
}

export function resolveStoryIdFromParam(value: string | null | undefined): string | null {
  return findStoryByIdOrSlug(value)?.id ?? null
}
