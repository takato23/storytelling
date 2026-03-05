"use client"

import React from "react"
import { motion } from "framer-motion"

interface MediaLogo {
    name: string
    svg?: React.ReactNode
}

const MEDIA_LOGOS: MediaLogo[] = [
    { name: "TechCrunch" },
    { name: "Forbes" },
    { name: "Parents" },
    { name: "Mashable" },
    { name: "The Verge" },
]

export function MediaLogos({ className = "" }: { className?: string }) {
    return (
        <div className={`py-8 ${className}`}>
            <motion.p
                className="text-center text-sm text-charcoal-400 mb-6 uppercase tracking-wider font-medium"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
            >
                Destacados en
            </motion.p>

            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
                {MEDIA_LOGOS.map((logo, index) => (
                    <motion.div
                        key={logo.name}
                        className="flex items-center gap-2 text-charcoal-300 hover:text-charcoal-500 transition-colors"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <span className="text-lg md:text-xl font-bold tracking-tight opacity-50 hover:opacity-80 transition-opacity">
                            {logo.name}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default MediaLogos
