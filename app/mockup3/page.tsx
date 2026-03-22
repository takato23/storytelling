"use client"

import React, { Suspense, useEffect, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { ArrowRight, Sparkles, Smile, Star, Puzzle } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const Book3D = dynamic(() => import("@/components/3d/Book3D"), { ssr: false })

function FloatingCard({ className, children, delay, icon: Icon, color }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, rotate: Math.random() * 20 - 10 }}
      animate={{ opacity: 1, scale: 1, y: [-5, 5, -5] }}
      transition={{ 
        y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay },
        opacity: { duration: 0.5, delay },
        scale: { duration: 0.5, delay, type: "spring" }
      }}
      className={`absolute flex items-center gap-3 rounded-2xl bg-white dark:bg-zinc-800 p-4 shadow-xl border border-zinc-100 dark:border-zinc-700 ${className}`}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-100 dark:bg-${color}-900/40 text-${color}-600 dark:text-${color}-400`}>
         {Icon && <Icon className="h-5 w-5" />}
      </div>
      <span className="font-bold text-sm text-zinc-700 dark:text-zinc-200">{children}</span>
    </motion.div>
  )
}

export default function Mockup3() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <main className="min-h-screen bg-[#FAFAFA] dark:bg-[#121212] overflow-hidden">
      <section className="relative min-h-[90vh] flex flex-col justify-center items-center px-4 pt-20 pb-16">
        
        {/* Background Decorative Blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-[800px] h-[800px] bg-yellow-200/50 dark:bg-yellow-900/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[600px] h-[600px] bg-purple-300/40 dark:bg-purple-900/30 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Content Wrapper */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-white/10 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8"
            >
               <span className="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-400 text-xs">✌️</span>
               <span className="text-sm font-bold text-zinc-600 dark:text-zinc-300">¡Creación automática!</span>
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-7xl font-black text-zinc-900 dark:text-white leading-[1.1] mb-6"
            >
              Su foto es el <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-500">
                inicio
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-yellow-400" viewBox="0 0 100 20" preserveAspectRatio="none"><path d="M0 10 Q 50 20 100 10" stroke="currentColor" strokeWidth="8" strokeLinecap="round" fill="none"/></svg>
              </span> de una aventura.
            </motion.h1>
            
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl sm:text-2xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10"
            >
              Creamos cuentos donde tu hijo o hija es 100% real. Sube solo una foto y magia, el libro nace ante tus ojos.
            </motion.p>
            
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/crear">
                <Button size="lg" className="h-16 px-10 rounded-[2rem] bg-indigo-600 hover:bg-indigo-700 text-white text-xl font-bold shadow-[0_8px_30px_rgba(79,70,229,0.4)] hover:shadow-[0_8px_40px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1">
                  ¡Hacer magia ahora! <Sparkles className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Central Interactive Book + Floating Cards */}
          <div className="relative w-full max-w-4xl mx-auto h-[400px] lg:h-[600px]">
            
            {/* The Cards */}
            <FloatingCard className="-top-10 left-0 lg:-left-20 rotate-[-12deg]" delay={0.2} icon={Smile} color="pink">
              ¡Reconocimiento Facial!
            </FloatingCard>
            
            <FloatingCard className="top-1/4 -right-10 lg:-right-32 rotate-[8deg]" delay={0.4} icon={Star} color="yellow">
              Calidad Premium
            </FloatingCard>
            
            <FloatingCard className="bottom-0 left-10 lg:-left-10 rotate-[5deg] z-20" delay={0.6} icon={Puzzle} color="blue">
               Versión Impresa
            </FloatingCard>

            {/* The Book */}
            <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center z-10 w-full h-[120%] -translate-y-[10%] drop-shadow-2xl">
              <Suspense fallback={<div className="h-[400px] w-[300px] bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />}>
                <Book3D coverColor="#4f46e5" coverImage="/stories/space-1.jpg" />
              </Suspense>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
