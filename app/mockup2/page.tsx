"use client"

import React, { Suspense, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Star } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const Book3D = dynamic(() => import("@/components/3d/Book3D"), { ssr: false })

export default function Mockup2() {
  const prefersReducedMotion = useReducedMotion()
  return (
    <main className="min-h-screen bg-white dark:bg-black selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      <section className="relative min-h-[90vh] flex flex-col items-center justify-start pt-32 pb-24 px-6">
        {/* Apple Minimalist Typography */}
        <div className="max-w-4xl w-full text-center z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-[4rem] sm:text-[6rem] lg:text-[8rem] font-sans font-medium tracking-tighter leading-[0.9] text-black dark:text-white mb-8">
              Protagonista. <br />
              <span className="text-zinc-400 dark:text-zinc-600">Al instante.</span>
            </h1>
          </motion.div>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-xl sm:text-2xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-12"
          >
            Sube una foto y ve crecer la magia de forma automatizada. Libros físicos y digitales hiper-personalizados en calidad de estudio.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/crear">
              <Button size="lg" className="rounded-full bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 px-10 py-7 text-lg font-medium">
                Empezar crear <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#como-funciona" className="text-black dark:text-white font-medium underline underline-offset-4 hover:opacity-70 transition-opacity">
              Descubrir más
            </Link>
          </motion.div>
        </div>

        {/* The Single Big Element */}
        <div className="relative w-full max-w-3xl aspect-[16/9] mt-24 mb-12 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-100 to-transparent dark:from-zinc-900 rounded-[3rem] -z-10" />
          <motion.div 
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[350px] lg:w-[500px]"
            animate={prefersReducedMotion ? undefined : { y: [-10, 10, -10] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Suspense fallback={<div className="h-[600px] w-full bg-zinc-200 dark:bg-zinc-800 rounded-3xl animate-pulse" />}>
               <Book3D coverColor="#000" coverImage="/stories/space-1.jpg" />
            </Suspense>
          </motion.div>
        </div>
      </section>
    </main>
  )
}
