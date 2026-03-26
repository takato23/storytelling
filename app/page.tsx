"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Camera, Gift, Sparkles, Star, Wand2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BrandWordmark } from "@/components/layout/BrandWordmark"
import { Footer } from "@/components/layout/Footer"
import { ImageComparisonSlider } from "@/components/ui/ImageComparisonSlider"
import { captureEvent } from "@/lib/analytics/events"
import { getStoryMocksByIds, siteContent } from "@/lib/site-content"

const featuredStories = getStoryMocksByIds(siteContent.home.featuredStoryIds)
const libraryStories = getStoryMocksByIds(siteContent.home.libraryStoryIds)
const heroHighlights = siteContent.home.hero.highlights
const benefits = siteContent.home.finalCta.benefits

const steps = [
  {
    title: siteContent.home.process.steps[0].title,
    description: siteContent.home.process.steps[0].description,
    icon: Camera,
    tone: siteContent.home.process.steps[0].tone,
  },
  {
    title: siteContent.home.process.steps[1].title,
    description: siteContent.home.process.steps[1].description,
    icon: BookOpen,
    tone: siteContent.home.process.steps[1].tone,
  },
  {
    title: siteContent.home.process.steps[2].title,
    description: siteContent.home.process.steps[2].description,
    icon: Wand2,
    tone: siteContent.home.process.steps[2].tone,
  },
  {
    title: siteContent.home.process.steps[3].title,
    description: siteContent.home.process.steps[3].description,
    icon: Gift,
    tone: siteContent.home.process.steps[3].tone,
  },
]

function SectionHeader({
  eyebrow,
  title,
  copy,
  href,
}: {
  eyebrow: string
  title: string
  copy: string
  href?: string
}) {
  return (
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <span className="nido-kicker">{eyebrow}</span>
        <h2 className="nido-section-title mt-4">{title}</h2>
        <p className="nido-section-copy mt-3">{copy}</p>
      </div>

      {href ? (
        <Link href={href} className="nido-inline-link inline-flex items-center gap-2 text-sm font-semibold">
          Ver todo
          <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  )
}

export default function Home() {
  const pathname = usePathname()

  useEffect(() => {
    captureEvent("landing_view", {
      market: "AR",
      path: pathname ?? "/",
    })
  }, [pathname])

  return (
    <main className="nido-page relative min-h-screen overflow-hidden text-[var(--nido-ink)]">
      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6">
        <section className="nido-hero-shell mb-16 overflow-hidden rounded-[40px] px-6 py-7 md:mb-20 md:px-8 md:py-8 lg:px-12 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
              className="max-w-2xl"
            >
              <BrandWordmark size="hero" tagline={siteContent.brand.tagline} />

              <div className="mt-8 max-w-xl">
                <span className="nido-kicker">
                  <Sparkles className="h-4 w-4" />
                  {siteContent.home.hero.kicker}
                </span>
                <h1 className="nido-hero-title mt-5">
                  {siteContent.home.hero.title}
                </h1>
                <p className="nido-hero-copy mt-4">
                  {siteContent.home.hero.copy}
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/crear" className="nido-button-primary inline-flex items-center justify-center gap-2 px-6 py-4 text-base">
                  {siteContent.home.hero.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/nuestros-libros" className="nido-button-secondary inline-flex items-center justify-center gap-2 px-6 py-4 text-base">
                  {siteContent.home.hero.secondaryCtaLabel}
                </Link>
              </div>

              <div className="nido-hero-ledger mt-8 grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <article key={item.value} className="nido-hero-ledger-card">
                    <p className="nido-hero-ledger-value">{item.value}</p>
                    <p className="nido-hero-ledger-detail">{item.detail}</p>
                  </article>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08 }}
              className="nido-hero-visual relative mx-auto w-full max-w-[560px]"
            >
              <div className="rotate-[-2deg] overflow-hidden rounded-[34px]">
                <ImageComparisonSlider
                  beforeImage="/images/generated/kid_photo.png"
                  afterImage="/images/generated/kid_pixar_correlate.png"
                  beforeLabel={siteContent.home.hero.beforeLabel}
                  afterLabel={siteContent.home.hero.afterLabel}
                  instructionText={siteContent.home.hero.comparisonInstruction}
                  className="aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/3]"
                />
              </div>

              <div className="nido-note-card absolute -bottom-6 left-0 hidden max-w-[220px] -rotate-2 p-4 md:block md:left-[-3%]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--nido-sage-strong)]">
                  {siteContent.home.hero.notes.processTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--nido-muted)]">
                  {siteContent.home.hero.notes.processCopy}
                </p>
              </div>

              <div className="nido-note-card absolute right-0 top-8 hidden max-w-[220px] rotate-[3deg] p-4 md:block md:right-[-3%]">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--nido-peach)]">
                  {siteContent.home.hero.notes.keepTitle}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--nido-muted)]">
                  {siteContent.home.hero.notes.keepCopy}
                </p>
              </div>

              <p className="mt-4 px-2 text-sm leading-6 text-[var(--nido-muted)] md:hidden">
                {siteContent.home.hero.mobileHelper}
              </p>
            </motion.div>
          </div>
        </section>

        <section className="mb-16 md:mb-20">
          <div className="nido-section-shelf">
            <SectionHeader
              eyebrow={siteContent.home.featured.eyebrow}
              title={siteContent.home.featured.title}
              copy={siteContent.home.featured.copy}
              href="/nuestros-libros"
            />

            <div className="grid gap-6 lg:grid-cols-3">
              {featuredStories.map((story, index) => (
                <motion.article
                  key={story.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.08 }}
                  className="nido-story-card h-full overflow-hidden rounded-[32px] p-4"
                >
                  <div className="relative overflow-hidden rounded-[26px]">
                    <Image
                      src={story.coverImage}
                      alt={story.title}
                      width={480}
                      height={640}
                      sizes="(min-width: 1024px) 22rem, (min-width: 768px) 30vw, 100vw"
                      className="aspect-[3/4] w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                    />
                    {index === 0 ? (
                      <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--nido-sage-strong)]">
                        Nuevo
                      </span>
                    ) : null}
                  </div>

                  <div className="px-2 pb-2 pt-5">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="nido-mini-tag">{story.ages}</span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-[var(--nido-muted)]">
                        <Star className="h-4 w-4 fill-[var(--nido-peach)] text-[var(--nido-peach)]" />
                        {story.reviews[0]?.rating?.toFixed(1) ?? "4.9"}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tight text-[var(--nido-ink)]">{story.title}</h3>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--nido-muted)]">
                      {story.shortDescription}
                    </p>
                    <div className="mt-5 flex items-center justify-between">
                      <Link href={`/cuentos/${story.slug}`} className="nido-inline-link inline-flex items-center gap-2 text-sm font-semibold">
                        Ver cuento
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href={`/crear?story=${story.slug}`} className="nido-soft-pill">
                        Personalizar
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-16 grid gap-8 md:mb-20 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
          <motion.article
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45 }}
            className="nido-feature-panel overflow-hidden rounded-[34px] p-5 md:p-6"
          >
            <div className="overflow-hidden rounded-[28px]">
              <Image
                src="/images/generated/premium_book.png"
                alt="Libro abierto con ilustraciones suaves"
                width={640}
                height={640}
                sizes="(min-width: 1024px) 28rem, 100vw"
                className="aspect-[1/1] w-full object-cover"
              />
            </div>
            <div className="mt-6">
              <span className="nido-kicker">{siteContent.home.library.featureEyebrow}</span>
              <h2 className="nido-section-title mt-4 text-3xl md:text-4xl">
                {siteContent.home.library.featureTitle}
              </h2>
              <p className="nido-section-copy mt-3">
                {siteContent.home.library.featureCopy}
              </p>
              <Link href="/crear" className="nido-inline-link mt-5 inline-flex items-center gap-2 text-sm font-semibold">
                {siteContent.home.library.featureActionLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.article>

          <div>
            <SectionHeader
              eyebrow={siteContent.home.library.eyebrow}
              title={siteContent.home.library.title}
              copy={siteContent.home.library.copy}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {libraryStories.map((story, index) => (
                <motion.article
                  key={story.slug}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.42, delay: index * 0.06 }}
                  className="nido-card-soft flex gap-4 rounded-[28px] p-4"
                >
                  <Image
                    src={story.coverImage}
                    alt={story.title}
                    width={240}
                    height={280}
                    sizes="12rem"
                    className="h-28 w-24 rounded-[20px] object-cover"
                  />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="nido-mini-tag w-fit">{story.style}</span>
                    <h3 className="mt-3 text-lg font-black leading-tight text-[var(--nido-ink)]">
                      {story.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--nido-muted)]">
                      {story.shortDescription}
                    </p>
                    <Link
                      href={`/crear?story=${story.slug}`}
                      className="nido-inline-link mt-auto inline-flex items-center gap-2 pt-3 text-sm font-semibold"
                    >
                      Elegir historia
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="como-funciona" className="mb-16 scroll-mt-28 md:mb-20">
          <div className="nido-process-shell">
            <SectionHeader
              eyebrow={siteContent.home.process.eyebrow}
              title={siteContent.home.process.title}
              copy={siteContent.home.process.copy}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {steps.map((step, index) => {
                const Icon = step.icon

                return (
                  <motion.article
                    key={step.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.42, delay: index * 0.06 }}
                    className={`nido-step-card nido-step-card-${step.tone} rounded-[28px] p-5`}
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <span className={`nido-step-cloud nido-step-cloud-${step.tone}`}>
                        <span className="nido-step-cloud-glyph">
                          <Icon className="h-5 w-5" />
                        </span>
                      </span>
                      <span className="nido-step-count">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="text-xl font-black tracking-tight text-[var(--nido-ink)]">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-[var(--nido-muted)]">{step.description}</p>
                  </motion.article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="nido-wave-panel relative overflow-hidden rounded-[40px] px-6 py-12 md:px-10 md:py-14">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="max-w-2xl">
              <span className="nido-kicker">
                <Sparkles className="h-4 w-4" />
                {siteContent.home.finalCta.eyebrow}
              </span>
              <h2 className="nido-section-title mt-5 text-4xl md:text-5xl">
                {siteContent.home.finalCta.title}
              </h2>
              <p className="nido-section-copy mt-4">
                {siteContent.home.finalCta.copy}
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {benefits.map((benefit) => (
                  <div key={benefit} className="nido-benefit-row">
                    <span className="nido-benefit-dot" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/crear" className="nido-button-primary inline-flex items-center justify-center gap-2 px-6 py-4 text-base">
                  {siteContent.home.finalCta.primaryCtaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/nuestros-libros" className="nido-button-secondary inline-flex items-center justify-center gap-2 px-6 py-4 text-base">
                  {siteContent.home.finalCta.secondaryCtaLabel}
                </Link>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45 }}
              className="relative mx-auto w-full max-w-[520px]"
            >
              <div className="nido-hero-photo-panel overflow-hidden rounded-[34px] p-3">
                <Image
                  src="/images/generated/premium_book.png"
                  alt="Libro abierto listo para regalar"
                  width={720}
                  height={600}
                  sizes="(min-width: 1024px) 34rem, 100vw"
                  className="aspect-[6/5] w-full rounded-[28px] object-cover"
                />
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
