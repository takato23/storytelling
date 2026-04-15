import { storyMocks, findStoryMockByIdOrSlug, type StoryMockContent } from "@/lib/site-content"
import { VALENTIN_DINO_STORY_ID } from "@/lib/books/valentin-dino-package";

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

const commercialStoryMocks = storyMocks.filter((story) => story.id === VALENTIN_DINO_STORY_ID);

export const STORIES: Story[] = commercialStoryMocks.map(toStory)

export function findStoryByIdOrSlug(value: string | null | undefined): Story | null {
  const storyMock = commercialStoryMocks.find(
    (story) => story.id === value?.trim() || story.slug === value?.trim(),
  ) ?? findStoryMockByIdOrSlug(value)
  if (!storyMock) return null
  if (storyMock.id !== VALENTIN_DINO_STORY_ID) return null
  return toStory(storyMock)
}

export function resolveStoryIdFromParam(value: string | null | undefined): string | null {
  return findStoryByIdOrSlug(value)?.id ?? null
}
