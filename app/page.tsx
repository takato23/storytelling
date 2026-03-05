"use client"

import React, { Suspense, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Shield, Sparkles, Star, User, Wand2 } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { captureEvent } from "@/lib/analytics/events"
import { BestsellersCarousel } from "@/components/sections/BestsellersCarousel"
import { FAQSection } from "@/components/sections/FAQSection"
import { FinalCTA } from "@/components/sections/FinalCTA"
import { Footer } from "@/components/layout/Footer"
import { HowItWorksSection } from "@/components/sections/HowItWorksSection"
import { LiveFaceDemo } from "@/components/sections/LiveFaceDemo"
import { PricingSection } from "@/components/sections/PricingSection"
import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { TestimonialsSection } from "@/components/sections/TestimonialsSection"
import { TheMagicSection } from "@/components/sections/TheMagicSection"
import { ThematicStoryRows } from "@/components/sections/ThematicStoryRows"
import { TrustStrip } from "@/components/ui/TrustStrip"

const Book3D = dynamic(() => import("@/components/3d/Book3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="relative w-48 h-64 perspective-1000">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-800/50 to-purple-900/50 rounded-lg rounded-l-sm shadow-2xl animate-pulse">
          <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-950/30 rounded-l-sm" />
          <div className="absolute inset-0 overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
          <div className="absolute inset-x-4 top-8 h-4 bg-white/20 rounded" />
          <div className="absolute inset-x-8 top-14 h-3 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  ),
})

const MagicalParticles = dynamic(() => import("@/components/effects/MagicalParticles"), {
  ssr: false,
})

const MascotCharacter = dynamic(() => import("@/components/ui/MascotCharacter"), {
  ssr: false,
})

function useCompactMotion() {
  const prefersReducedMotion = useReducedMotion()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1024px)")
    const apply = () => setIsMobile(media.matches)
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [])

  return prefersReducedMotion || isMobile
}

function HeroSection({ onPrimaryCtaClick }: { onPrimaryCtaClick: () => void }) {
  const compactMotion = useCompactMotion()
  const floatEase = [0.42, 0, 0.58, 1] as const

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-32 lg:pb-48 px-4 lg:px-8 overflow-hidden bg-gradient-to-b from-purple-50 via-[#f8eff9] to-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={compactMotion ? undefined : { x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: floatEase }}
          className="absolute top-[-20%] right-[-10%] w-[520px] lg:w-[800px] h-[520px] lg:h-[800px] bg-purple-300/25 blur-[120px] rounded-full"
        />
        <motion.div
          animate={compactMotion ? undefined : { x: [0, -80, 0], y: [0, 60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: floatEase }}
          className="absolute bottom-[-10%] left-[-5%] w-[420px] lg:w-[600px] h-[420px] lg:h-[600px] bg-pink-300/25 blur-[100px] rounded-full"
        />

        {!compactMotion && (
          <>
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: floatEase }}
              className="absolute top-[15%] left-[10%] opacity-40 text-purple-400"
            >
              <svg width="60" height="40" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M17.5 19c-2.485 0-4.5-2.015-4.5-4.5 0-.472.073-.927.208-1.353C12.396 12.348 11.234 12 10 12c-3.314 0-6 2.686-6 6s2.686 6 6 6h7.5c1.933 0 3.5-1.567 3.5-3.5S19.433 19 17.5 19z" />
              </svg>
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 5, repeat: Infinity, delay: 1, ease: floatEase }}
              className="absolute top-[25%] right-[15%] opacity-60"
            >
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
            </motion.div>

            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
              transition={{ duration: 7, repeat: Infinity, delay: 2, ease: floatEase }}
              className="absolute bottom-[30%] left-[20%] opacity-50"
            >
              <Sparkles className="w-10 h-10 text-pink-400" />
            </motion.div>
          </>
        )}
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full lg:w-1/2 flex flex-col justify-center text-center lg:text-left pt-10 lg:pt-0"
        >
          <div className="flex justify-center lg:justify-start mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-purple-100 text-sm text-purple-700 font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-500" />
              Magia impulsada por IA
            </span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-serif text-[#2D1B4E] mb-6 leading-[1.1] drop-shadow-sm">
            ¡Haz que tu hijo sea el <span className="text-purple-600 relative inline-block">
              héroe
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-yellow-400" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="4" fill="none" /></svg>
            </span> de la historia!
          </h1>

          <p className="text-xl lg:text-2xl text-charcoal-600 mb-10 font-medium max-w-xl mx-auto lg:mx-0">
            Crea cuentos infantiles personalizados en minutos. Solo sube <strong className="text-purple-700">una foto</strong> y conviértelo en el protagonista de aventuras inolvidables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start w-full sm:w-auto">
            <Link href="/crear" className="w-full sm:w-auto" onClick={onPrimaryCtaClick}>
              <Button
                size="lg"
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white rounded-[24px] py-8 px-10 font-bold text-xl shadow-[0_10px_30px_-10px_rgba(147,51,234,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(147,51,234,0.8)] transition-all hover:scale-[1.03] active:scale-95 group/cta"
              >
                <span className="flex items-center gap-3">
                  <Wand2 className="w-6 h-6" />
                  Crear Cuento Ahora
                </span>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-4 group-hover/cta:translate-x-1 transition-transform">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </Button>
            </Link>

            <div className="flex items-center justify-center lg:justify-start gap-4 mt-4 sm:mt-0 sm:ml-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-white overflow-hidden bg-purple-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-300" />
                  </div>
                ))}
              </div>
              <div className="text-left text-xs font-bold text-charcoal-600 leading-tight">
                Historias creadas para <span className="text-purple-600">familias de Argentina</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center lg:justify-start gap-6 text-sm font-bold text-charcoal-500">
            <div className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-emerald-500" /> Checkout seguro</div>
            <div className="flex items-center gap-1.5"><Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> Historias que emocionan</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
          className="w-full lg:w-1/2 relative flex items-center justify-center min-h-[360px] lg:min-h-[600px]"
        >
          <div className="absolute inset-0 bg-white/40 rounded-full blur-3xl" />

          {!compactMotion && <MagicalParticles className="opacity-70 scale-105" />}

          <motion.div
            animate={compactMotion ? undefined : { y: [-10, 10, -10] }}
            transition={{ duration: 5, repeat: Infinity, ease: floatEase }}
            className="relative z-10 w-full h-[320px] lg:h-[500px] max-w-lg drop-shadow-[0_40px_60px_rgba(147,51,234,0.3)]"
          >
            {compactMotion ? (
              <div className="mx-auto w-[240px] sm:w-[280px] lg:w-[360px] h-full rounded-[24px] border border-white/80 bg-white/80 backdrop-blur-md shadow-xl p-4">
                <img
                  src="/stories/space-1.jpg"
                  alt="Portada de cuento personalizado"
                  className="w-full h-full rounded-[18px] object-cover"
                />
              </div>
            ) : (
              <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                </div>
              }>
                <Book3D
                  coverColor="#9333ea"
                  coverImage="/stories/space-1.jpg"
                />
              </Suspense>
            )}
          </motion.div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none pointer-events-none">
        <svg className="relative block w-full h-[50px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,198.71,115.68,239.5,112.27,279.7,101.44,321.39,56.44Z" className="fill-white"></path>
        </svg>
      </div>
    </section>
  )
}

export default function Home() {
  const pathname = usePathname()
  const compactMotion = useCompactMotion()

  useEffect(() => {
    captureEvent("landing_view", {
      market: "AR",
      path: pathname ?? "/",
    })
  }, [pathname])

  const handleHeroCtaClick = () => {
    captureEvent("landing_cta_click", {
      cta_id: "hero_primary",
      section: "hero",
    })
  }

  const handleFinalCtaClick = () => {
    captureEvent("landing_cta_click", {
      cta_id: "final_primary",
      section: "final_cta",
    })
  }

  return (
    <main className="min-h-screen bg-cream-50">
      {!compactMotion && <MascotCharacter showTips={true} />}

      <HeroSection onPrimaryCtaClick={handleHeroCtaClick} />

      <TrustStrip className="mt-2 mb-8" />

      <BestsellersCarousel />

      <div className="w-full h-11 bg-[#f5f0eb]">
        <svg className="block w-full h-full text-white" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,198.71,115.68,239.5,112.27,279.7,101.44,321.39,56.44Z" fill="currentColor"></path>
        </svg>
      </div>

      <HowItWorksSection />

      <LiveFaceDemo />

      <TestimonialsSection />

      <ThematicStoryRows />

      <StoryCatalog
        title={
          <>
            <span className="block text-center mb-4">
              <span className="inline-block px-4 py-2 rounded-full bg-coral-100 text-coral-700 text-sm font-medium">
                Catálogo Completo
              </span>
            </span>
            <span className="block text-center text-3xl md:text-4xl lg:text-5xl font-serif text-charcoal-900 mb-4">
              Explora todas nuestras <span className="text-coral-500">aventuras</span>
            </span>
          </>
        }
        subtitle=""
        className="bg-white"
      />

      <TheMagicSection />

      <PricingSection />

      <FAQSection />

      <FinalCTA onPrimaryClick={handleFinalCtaClick} />

      <Footer />
    </main>
  )
}
