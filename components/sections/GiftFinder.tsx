"use client"

import React from "react"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const CATEGORIES = [
    {
        id: "babies",
        title: "0-3 años",
        subtitle: "Para los más pequeños",
        description: "Historias tiernas de descubrimiento",
        color: "bg-[#F4EBE2]", // Soft beige/cream like Wonderbly
        textColor: "text-charcoal-900",
        image: "/images/category-babies.jpg",
        link: "/catalog?age=0-3"
    },
    {
        id: "toddlers",
        title: "3-6 años",
        subtitle: "Primeros lectores",
        description: "Aventuras llenas de imaginación",
        color: "bg-[#E8F1F2]", // Soft blue/green
        textColor: "text-charcoal-900",
        image: "/stories/dino-1.jpg",
        link: "/catalog?age=3-6"
    },
    {
        id: "kids",
        title: "+ de 6 años",
        subtitle: "Lectores avanzados",
        description: "Historias épicas y emocionantes",
        color: "bg-[#F2E8E8]", // Soft rose
        textColor: "text-charcoal-900",
        image: "/stories/space-1.jpg",
        link: "/catalog?age=6+"
    },
    {
        id: "family",
        title: "Familias",
        subtitle: "Para compartir",
        description: "El regalo perfecto para todos",
        color: "bg-[#EFE8D8]", // Warm taupe
        textColor: "text-charcoal-900",
        image: "/stories/castle-1.jpg",
        link: "/catalog?type=family"
    }
]

export function GiftFinder({ className = "" }: { className?: string }) {
    return (
        <section className={`py-12 md:py-20 bg-white ${className}`}>
            <div className="container mx-auto px-4 md:px-6">
                <motion.div
                    className="mb-10 md:mb-14"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-fluid-section font-serif text-charcoal-900 mb-3 font-medium">
                        ¿Para quién es el libro que vas a crear?
                    </h2>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {CATEGORIES.map((cat, index) => (
                        <Link href={cat.link} key={cat.id} className="group relative block w-full aspect-[4/5] overflow-hidden rounded-lg cursor-pointer">
                            <motion.div
                                className="w-full h-full relative"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                            >
                                {/* Background Image with Overlay */}
                                <div className={`absolute inset-0 ${cat.color} transition-colors duration-500`}>
                                    <Image
                                        src={cat.image}
                                        alt={cat.title}
                                        fill
                                        className="object-cover opacity-90 group-hover:scale-105 transition-transform duration-700 ease-out"
                                        sizes="(max-width: 768px) 50vw, 25vw"
                                    />
                                    {/* Enhanced gradient overlay for better text readability */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/50 transition-all duration-500" />
                                </div>

                                {/* Content Overlay */}
                                <div className="absolute inset-0 flex flex-col items-center justify-end p-6 text-center pb-8">
                                    {/* Category badge */}
                                    <span className="absolute top-4 left-4 px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        {cat.subtitle}
                                    </span>

                                    <h3 className="text-3xl md:text-4xl font-serif text-white mb-2" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                                        {cat.title}
                                    </h3>

                                    {/* Button that appears/slides up on hover */}
                                    <div className="overflow-hidden h-0 group-hover:h-auto group-hover:mt-4 transition-all duration-300">
                                        <div className="bg-white text-charcoal-900 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wide flex items-center gap-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 shadow-lg hover:shadow-xl">
                                            Ver libros
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default GiftFinder
