"use client"

import React, { useState, Suspense } from "react"
import { motion } from "framer-motion"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
    ArrowRight,
    Check,
    Star,
    Shield,
    BookOpen,
    Clock,
    Printer
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { STORIES, type Story } from "@/lib/stories"

// Dynamic imports
const Book3D = dynamic(() => import("@/components/3d/Book3D"), { ssr: false })
const MagicalParticles = dynamic(() => import("@/components/effects/MagicalParticles"), { ssr: false })

export default function StoryExactPage() {
    const params = useParams()
    const router = useRouter()

    // Find story data
    const story = STORIES.find(s => s.slug === params.slug)

    // Handle 404 or loading
    if (!story) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-cream-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-charcoal-900 mb-4">Cuento no encontrado</h1>
                    <Link href="/">
                        <Button variant="outline">Volver al inicio</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <main className="min-h-screen bg-[#f5f0eb]">
            {/* 1. HERO SECTION - Two Symmetric Glass Cards (Like Open Book Pages) */}
            <section className="relative min-h-screen flex items-center justify-center p-4 lg:p-8 overflow-hidden">

                {/* Background Liquid Blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{
                            x: [0, 150, 0],
                            y: [0, -70, 0],
                            scale: [1, 1.3, 1]
                        }}
                        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                        className="absolute top-[-10%] right-[10%] w-[700px] h-[700px] bg-purple-500/10 blur-[130px] rounded-full"
                    />
                    <motion.div
                        animate={{
                            x: [0, -120, 0],
                            y: [0, 150, 0],
                            scale: [1, 1.4, 1]
                        }}
                        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                        className="absolute bottom-[-15%] left-[5%] w-[800px] h-[800px] bg-coral-500/10 blur-[130px] rounded-full"
                    />
                </div>

                {/* The Open Book Container */}
                <div className="relative z-10 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-0 lg:gap-1">

                    {/* LEFT GLASS CARD (Book Visual) */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="w-full lg:w-1/2 relative bg-gradient-to-br from-[#1a0b36] to-[#0c051a] backdrop-blur-[40px] lg:rounded-l-[50px] rounded-t-[50px] lg:rounded-tr-none border border-white/10 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] p-8 lg:p-12 overflow-hidden min-h-[60vh] lg:min-h-[85vh] flex flex-col"
                    >
                        {/* Interior Glows */}
                        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-coral-500/20 rounded-full blur-[100px] mix-blend-screen" />
                        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] mix-blend-screen" />

                        <MagicalParticles className="opacity-60 scale-100" />

                        {/* Book Container */}
                        <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className="w-full h-[280px] lg:h-[400px] max-w-md"
                            >
                                <Suspense fallback={
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                                    </div>
                                }>
                                    <Book3D
                                        coverColor={story.coverColor}
                                        coverImage={story.coverImage}
                                    />
                                </Suspense>
                            </motion.div>

                            {/* Book Label */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 }}
                                className="mt-8 text-center"
                            >
                                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/10">
                                    <span className="text-2xl">{story.icon}</span>
                                    <span className="text-white/80 font-serif text-lg">{story.title}</span>
                                </div>
                            </motion.div>
                        </div>

                        {/* Bottom: Rating Badge */}
                        <div className="relative z-20 flex items-center justify-between pt-6 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                    <span className="font-bold text-white text-sm">4.9/5.0</span>
                                </div>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Satisfacción Total</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* RIGHT GLASS CARD (Content) */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                        className="w-full lg:w-1/2 relative bg-white/70 backdrop-blur-[40px] lg:rounded-r-[50px] rounded-b-[50px] lg:rounded-bl-none border border-white/80 shadow-[0_60px_120px_-30px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] p-8 lg:p-12 overflow-hidden min-h-[60vh] lg:min-h-[85vh] flex flex-col"
                    >
                        {/* Top organic light */}
                        <div className="absolute top-[-20%] left-[-10%] w-[300px] h-[300px] bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative z-20 flex-1 flex flex-col">
                            {/* Header & Status */}
                            <div className="mb-8">
                                <Link href="/" className="group/back inline-flex items-center text-[11px] font-black text-indigo-950/40 hover:text-indigo-950 mb-8 transition-all uppercase tracking-[0.3em]">
                                    <div className="w-8 h-8 rounded-full bg-white border border-indigo-950/5 flex items-center justify-center mr-3 shadow-sm group-hover/back:-translate-x-1 transition-transform">
                                        <ArrowRight className="w-4 h-4 rotate-180" />
                                    </div>
                                    Regresar al Catálogo
                                </Link>

                                <div className="flex flex-wrap items-center gap-3 mb-6">
                                    <span className="px-4 py-1.5 bg-indigo-950 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        {story.ages}
                                    </span>
                                    <span className="px-4 py-1.5 bg-white/80 backdrop-blur-md text-indigo-950 border border-indigo-950/5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-sm">
                                        <Clock className="w-3.5 h-3.5 text-coral-500" />
                                        20 MIN
                                    </span>
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-serif text-charcoal-900 mb-6 leading-[1.1] tracking-tight drop-shadow-sm">
                                    {story.title}
                                </h1>

                                <p className="text-lg text-charcoal-700 leading-relaxed font-light mb-8 max-w-lg">
                                    {story.fullDescription}
                                </p>

                                <div className="mb-8 rounded-3xl border border-indigo-100 bg-indigo-50/65 p-5 space-y-3">
                                    <div className="flex items-center justify-between text-sm font-semibold text-indigo-700">
                                        <span>Descarga online</span>
                                        <span className="text-base font-black">
                                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(story.digitalPriceArs)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-semibold text-charcoal-700">
                                        <span>Cuento impreso</span>
                                        <span className="text-base font-black">
                                            {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(story.printPriceArs)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Center */}
                                <div className="flex gap-3 flex-col sm:flex-row items-center p-2 bg-white/30 backdrop-blur-md rounded-[28px] border border-white/50 shadow-inner">
                                    <Button
                                        size="lg"
                                        className="w-full sm:flex-1 bg-indigo-950 hover:bg-black text-white rounded-[20px] py-8 font-bold text-lg shadow-2xl shadow-indigo-900/30 hover:shadow-black/30 transition-all hover:scale-[1.02] active:scale-95 group/cta"
                                        onClick={() => router.push(`/crear?story=${story.slug}`)}
                                    >
                                        Comenzar Personalización
                                        <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center ml-3 group-hover/cta:translate-x-1 transition-transform">
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </Button>

                                    <div className="hidden lg:flex flex-col gap-1.5 pr-6 pl-3 py-1">
                                        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-indigo-900/40 uppercase whitespace-nowrap"><Check className="w-3.5 h-3.5 text-teal-500" /> Envío Priority</div>
                                        <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-indigo-900/40 uppercase whitespace-nowrap"><Check className="w-3.5 h-3.5 text-teal-500" /> Papel Galería</div>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Info Interface */}
                            <div className="flex-1">
                                <StoryLiquidTabs story={story} />
                            </div>
                        </div>
                    </motion.div>

                </div>
            </section>

            {/* Cross-sell Section */}
            <section className="py-24 relative overflow-hidden bg-gradient-to-b from-[#f5f0eb] to-[#ebe4dc]">
                <div className="container mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center mb-14 text-center">
                        <h2 className="text-3xl lg:text-4xl font-serif text-charcoal-900 mb-3 drop-shadow-sm">Más Historias para Descubrir</h2>
                        <p className="text-charcoal-500 font-medium tracking-[0.15em] uppercase text-xs">Aventuras personalizadas para cada edad</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
                        {STORIES.filter(s => s.id !== story.id).slice(0, 5).map((s, idx) => (
                            <Link href={`/cuentos/${s.slug}`} key={s.id} className="group block">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.08 }}
                                    className="relative bg-white/80 backdrop-blur-xl rounded-[28px] border border-white/90 p-4 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] transition-all duration-500 group-hover:-translate-y-3"
                                >
                                    <div className="aspect-square bg-gradient-to-br from-white to-gray-50 rounded-[20px] mb-4 flex items-center justify-center border border-indigo-950/5 shadow-inner">
                                        <span className="text-4xl lg:text-5xl drop-shadow-lg group-hover:scale-110 transition-transform duration-500">{s.icon}</span>
                                    </div>
                                    <div className="text-[8px] font-black text-indigo-900/40 uppercase tracking-[0.2em] mb-1">{s.ages}</div>
                                    <h3 className="font-serif text-sm lg:text-base text-charcoal-800 leading-tight group-hover:text-indigo-950 transition-colors">{s.title}</h3>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    )
}

// Sub-component for Liquid Tabs with Carousel
function StoryLiquidTabs({ story }: { story: Story }) {
    const [activeTab, setActiveTab] = useState<'preview' | 'quality' | 'reviews'>('preview')
    const tabs: Array<{ id: "preview" | "quality" | "reviews"; label: string }> = [
        { id: "preview", label: "El Libro" },
        { id: "quality", label: "Formato" },
        { id: "reviews", label: "Elogios" },
    ]

    return (
        <div className="flex-1 flex flex-col pt-4">
            {/* Control Bar */}
            <div className="flex bg-indigo-950/5 p-2 rounded-[24px] mb-10 self-start backdrop-blur-lg border border-indigo-950/5">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab.id
                            ? 'text-white'
                            : 'text-indigo-950/40 hover:text-indigo-950/70'
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabLiquidV2"
                                className="absolute inset-0 bg-indigo-950 rounded-[18px] shadow-2xl shadow-indigo-950/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
                            />
                        )}
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Viewport */}
            <div className="relative min-h-[350px]">
                {activeTab === 'preview' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-8"
                    >
                        {/* Immersive Glass Carousel - FULL BLEED FIX */}
                        <div className="relative group/carousel">
                            <div className="absolute -inset-10 bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-coral-500/10 rounded-[60px] opacity-0 group-hover/carousel:opacity-100 transition-opacity blur-[60px]" />

                            <motion.div
                                whileHover={{ y: -5 }}
                                className="relative aspect-[16/10] bg-white rounded-[40px] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.15)] overflow-hidden border-[6px] border-white"
                            >
                                <div className="absolute inset-0 flex">
                                    {/* Left Page (Typography) */}
                                    <div className="w-1/2 p-10 flex items-center justify-center bg-[#fefcf9] border-r border-[#ece5da]">
                                        <div className="text-center max-w-xs relative z-10">
                                            <p className="font-serif text-[#4a342e] italic text-lg leading-relaxed mb-6 drop-shadow-sm">
                                                &ldquo;Fue entonces cuando <span className="text-coral-500 font-bold not-italic">Leo</span> comprendió que cada estrella era un sueño esperando nacer.&rdquo;
                                            </p>
                                            <div className="w-12 h-0.5 bg-coral-500/20 mx-auto" />
                                        </div>
                                        {/* Gradient Overlay for blending */}
                                        <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white/0 to-transparent pointer-events-none" />
                                    </div>

                                    {/* Right Page (Image) - Full Bleed */}
                                    <div className="w-1/2 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-[2000ms] group-hover/carousel:scale-110" style={{ backgroundImage: `url(${story.previewImages?.[0] || story.coverImage})` }} />

                                        {/* Inner Shadow for paper depth */}
                                        <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/5 to-transparent pointer-events-none" />
                                    </div>

                                    {/* Realistic Shading */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/[0.08] via-transparent to-black/[0.08] pointer-events-none" />
                                    <div className="absolute inset-y-0 left-1/2 w-[1px] bg-black/5 shadow-[0_0_10px_rgba(0,0,0,0.1)] z-10" />
                                </div>
                            </motion.div>

                            {/* Control Indicators */}
                            <div className="flex justify-center gap-3 mt-10">
                                {[1, 2, 3, 4].map(i => (
                                    <button key={i} className={`h-2 rounded-full transition-all duration-500 ${i === 1 ? 'w-12 bg-indigo-950' : 'w-2 bg-indigo-950/10 hover:bg-indigo-950/30'}`} />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'quality' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="grid grid-cols-2 gap-6"
                    >
                        {[
                            { icon: Printer, title: story.printSpecs.format, desc: "Ilustrado, resistente y pensado para manos pequeñas.", color: "bg-emerald-50" },
                            { icon: BookOpen, title: `Tamaño ${story.printSpecs.size}`, desc: "Ideal para leer juntos.", color: "bg-violet-50" },
                            { icon: Shield, title: `${story.printSpecs.pages} páginas`, desc: `${story.printSpecs.paper} de alta calidad.`, color: "bg-sky-50" },
                            { icon: Star, title: "Entrega a domicilio", desc: "Te lo enviamos a casa con seguimiento del pedido.", color: "bg-amber-50" }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-[32px] bg-white/60 border border-white shadow-sm hover:shadow-xl hover:bg-white transition-all group/item">
                                <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center mb-6 group-hover/item:scale-110 group-hover/item:rotate-3 transition-all`}>
                                    <item.icon className="w-7 h-7 text-indigo-950/80" />
                                </div>
                                <div className="font-black text-indigo-950 text-[11px] tracking-[0.2em] uppercase mb-2">{item.title}</div>
                                <div className="text-xs text-charcoal-400 font-medium leading-relaxed">{item.desc}</div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {activeTab === 'reviews' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="space-y-6 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar"
                    >
                        {story.reviews.map((review: Story["reviews"][number], i: number) => (
                            <div key={i} className="bg-white/60 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-sm hover:translate-x-2 transition-all duration-500">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 flex items-center justify-center font-black text-indigo-950 text-sm">
                                        {review.user.charAt(0)}
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-black text-charcoal-900 uppercase tracking-widest">{review.user}</div>
                                        <div className="flex text-yellow-400 mt-1">
                                            {[1, 2, 3, 4, 5].map(star => <Star key={star} className="w-3.5 h-3.5 fill-current" />)}
                                        </div>
                                    </div>
                                    <div className="ml-auto text-[9px] font-black text-indigo-950/20 uppercase tracking-[0.3em]">{review.date}</div>
                                </div>
                                <p className="text-charcoal-700/80 text-lg font-serif italic leading-relaxed">&ldquo;{review.comment}&rdquo;</p>
                            </div>
                        ))}
                        <button className="w-full mt-6 py-6 rounded-[24px] border-2 border-dashed border-indigo-950/10 text-indigo-950 font-black text-[11px] uppercase tracking-[0.3em] hover:bg-white/60 hover:border-indigo-950/30 transition-all">
                            Vibrant Community — 1,240 Reviews
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
