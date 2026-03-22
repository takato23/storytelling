"use client"

import React, { Suspense, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Sparkles, Wand2 } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const Book3D = dynamic(() => import("@/components/3d/Book3D"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  ),
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

function HeroBookFallback() {
  return (
    <div className="mx-auto h-full w-[280px] rounded-3xl overflow-hidden shadow-2xl">
      <img src="/stories/space-1.jpg" alt="Portada de cuento" className="h-full w-full object-cover" />
    </div>
  )
}

function HeroSection() {
  const compactMotion = useCompactMotion()
  const floatEase = [0.42, 0, 0.58, 1] as const

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-white dark:bg-[#1a1523] flex flex-col lg:flex-row items-stretch">
      {/* LEFT COLUMN: WonderWraps Light Aesthetic */}
      <div className="relative z-10 flex w-full flex-col justify-center px-6 pt-32 pb-16 lg:w-[50%] lg:px-16 xl:px-24">
        <motion.div
           initial={{ opacity: 0, y: 30 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, ease: "easeOut" }}
           className="w-full max-w-xl mx-auto lg:mx-0"
        >
          <div className="mb-6 flex">
            <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 dark:bg-purple-900/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300">
              <Sparkles className="h-4 w-4" /> Para tu hijo
            </span>
          </div>

          <h1 className="mb-6 font-sans text-5xl font-black tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.05]">
            Un <span className="text-purple-600 dark:text-purple-400">cuento</span> donde la magia es real.
          </h1>

          <p className="mb-10 text-xl font-medium text-slate-600 dark:text-slate-300">
            Sube una foto y creamos un libro donde tu pequeño es el héroe indiscutible. Personalizado desde la primera hasta la última página.
          </p>

          <div className="flex gap-4">
            <Link href="/crear">
              <Button size="lg" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white px-8 py-7 text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">
                Crear ahora
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* RIGHT COLUMN: The Magical Soft Cover */}
      <div className="relative z-0 flex w-full flex-1 items-center justify-center p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <motion.div
          animate={compactMotion ? undefined : { y: [-15, 15, -15], rotate: [-2, 2, -2] }}
          transition={{ duration: 6, repeat: Infinity, ease: floatEase }}
          className="relative w-full max-w-[450px] lg:h-[550px] aspect-[3/4]"
        >
          <div className="absolute inset-x-8 -bottom-12 h-10 rounded-[100%] bg-purple-900/20 dark:bg-black/40 blur-xl" />
          <Suspense fallback={<HeroBookFallback />}>
            <Book3D coverColor="#a855f7" coverImage="/stories/space-1.jpg" />
          </Suspense>
        </motion.div>
      </div>
    </section>
  )
}

export default function Mockup1() {
  return (
    <main className="min-h-screen">
      <HeroSection />
    </main>
  )
}
