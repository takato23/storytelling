"use client"

import React, { useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowRight, BookOpen, Sparkles, Star } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Footer } from "@/components/layout/Footer"
import { HowItWorksSection } from "@/components/sections/HowItWorksSection"
import { captureEvent } from "@/lib/analytics/events"
import { STORIES } from "@/lib/stories"

const featuredStories = STORIES.slice(0, 3)
const dreamStories = STORIES.slice(2, 5)

function SectionTitle({
  title,
  accent,
  href,
}: {
  title: string
  accent: string
  href?: string
}) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-[var(--text-primary)] md:text-5xl">{title}</h2>
        <div className={`mt-3 h-1.5 w-20 rounded-full ${accent}`} />
      </div>
      {href && (
        <Link
          href={href}
          className="hidden items-center gap-2 text-sm font-bold text-[var(--accent-primary)] transition-transform hover:translate-x-1 md:inline-flex"
        >
          Ver todo
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
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
    <main className="relative min-h-screen overflow-hidden bg-[#f6f6ff] text-[#1d2e51]">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          backgroundImage: `
            radial-gradient(circle at 10px 10px, rgba(59,130,246,0.34) 1.6px, transparent 0),
            radial-gradient(circle at 22px 22px, rgba(239,68,68,0.28) 1.4px, transparent 0),
            radial-gradient(circle at 6px 28px, rgba(34,197,94,0.22) 1.2px, transparent 0)
          `,
          backgroundSize: "56px 56px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 md:px-6">
        <section className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid gap-8 overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#6aa7f8,#72aefb)] p-6 shadow-[0_24px_80px_-36px_rgba(0,93,167,0.45)] md:p-10 lg:grid-cols-[1fr_0.92fr] lg:items-center lg:p-14"
          >
            <div className="max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#002b52]">
                <Sparkles className="h-4 w-4" />
                Cuentos personalizados
              </div>

              <h1 className="mb-5 text-5xl font-black leading-[0.9] tracking-tight text-[#08244a] md:text-6xl lg:text-7xl">
                Crea su propia aventura
              </h1>

              <p className="mb-8 max-w-lg text-lg font-medium leading-relaxed text-[#17386a] md:text-2xl">
                Imaginá un mundo donde tu hijo es el héroe. Subí una foto y empezá el viaje.
              </p>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/crear"
                  className="inline-flex items-center gap-3 rounded-full bg-[#fdd34d] px-8 py-4 text-lg font-black text-[#5c4900] shadow-[0_8px_0_0_#d97706,0_18px_28px_rgba(0,0,0,0.14)] transition-all hover:brightness-105 active:translate-y-[4px] active:shadow-[0_2px_0_0_#d97706]"
                >
                  <Sparkles className="h-5 w-5" />
                  Crear magia
                </Link>

                <Link
                  href="/nuestros-libros"
                  className="font-bold text-[#17386a] transition-colors hover:text-[#005da7]"
                >
                  Ver catálogo
                </Link>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[430px]">
              <div className="rotate-[3deg] overflow-hidden rounded-[36px] border border-[#002b52]/10 bg-[#16314f] shadow-2xl">
                <img
                  src="/stories/space-1.jpg"
                  alt="Portada destacada"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mb-16">
          <SectionTitle title="Novedades Mágicas" accent="bg-[#fdd34d]" href="/nuestros-libros" />

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredStories.map((story, index) => (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="group rounded-[32px] bg-[#d9e2ff] p-4 shadow-[0_18px_42px_-30px_rgba(0,93,167,0.3)] transition-transform hover:-translate-y-1"
              >
                <div className="relative mb-5 aspect-[3/4] overflow-hidden rounded-[26px] shadow-lg">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {index === 0 && (
                    <span className="absolute left-4 top-4 rounded-full bg-[#cbfecc] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-[#38643e]">
                      Nuevo
                    </span>
                  )}
                </div>

                <h3 className="mb-2 px-2 text-2xl font-black text-[#112a50]">{story.title}</h3>
                <p className="mb-4 px-2 text-sm font-medium leading-relaxed text-[#4b5b81]">
                  {story.shortDescription}
                </p>

                <div className="flex items-center justify-between px-2">
                  <span className="flex items-center gap-1 text-sm font-bold text-[#705900]">
                    <Star className="h-4 w-4 fill-current" />
                    {story.reviews[0]?.rating?.toFixed(1) ?? "4.9"}
                  </span>
                  <Link
                    href={`/cuentos/${story.slug}`}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#005da7] text-white shadow-lg transition-transform hover:scale-105"
                  >
                    <BookOpen className="h-5 w-5" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <SectionTitle title="Historias para Soñar" accent="bg-[#cbfecc]" />

          <div className="grid gap-6 md:grid-cols-3">
            {dreamStories.map((story, index) => (
              <motion.article
                key={story.slug}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.45 }}
                className="overflow-hidden rounded-[30px] border border-[#d9e2ff] bg-white shadow-[0_12px_30px_-24px_rgba(0,93,167,0.22)]"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#edf0ff]">
                  <img
                    src={story.coverImage}
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="mb-3 text-2xl font-black text-[#112a50]">{story.title}</h3>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-xs font-bold text-[#4b5b81]">
                      {story.ages}
                    </span>
                    <span className="rounded-full bg-[#edf0ff] px-3 py-1 text-xs font-bold text-[#4b5b81]">
                      {story.pages} págs
                    </span>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-[#4b5b81]">
                    {story.shortDescription}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <HowItWorksSection />

        <section className="rounded-[36px] bg-[#e1e8ff] px-6 py-10 text-center shadow-[0_18px_50px_-34px_rgba(0,93,167,0.28)] md:px-10">
          <div className="mx-auto max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#005da7]">
              <Sparkles className="h-4 w-4" />
              Hecho para regalar
            </div>
            <h2 className="mb-4 text-4xl font-black tracking-tight text-[#08244a] md:text-5xl">
              Un cuento que sí se guarda
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg font-medium leading-relaxed text-[#4b5b81]">
              Elegí una historia, personalizala con una foto y recibila digital o impresa.
            </p>
            <Link
              href="/crear"
              className="inline-flex items-center gap-3 rounded-full bg-[#005da7] px-8 py-4 text-lg font-black text-white shadow-[0_10px_28px_rgba(0,93,167,0.28)] transition-transform hover:scale-105"
            >
              Crear mi cuento
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  )
}
