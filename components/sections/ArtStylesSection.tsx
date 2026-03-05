"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Palette, Sparkles, Eye } from "lucide-react"

interface ArtStyle {
    id: string
    name: string
    title: string
    description: string
    color: string
    bgGradient: string
    sampleImage: string
    features: string[]
}

const ART_STYLES: ArtStyle[] = [
    {
        id: "pixar",
        name: "Pixar 3D",
        title: "Estilo Pixar 3D",
        description: "Ilustraciones con la calidad y calidez de las películas animadas más queridas. Personajes expresivos y colores vibrantes.",
        color: "#4F46E5",
        bgGradient: "from-indigo-500 to-purple-600",
        sampleImage: "/stories/space-1.jpg",
        features: ["Personajes 3D expresivos", "Iluminación cinematográfica", "Colores vibrantes"],
    },
    {
        id: "watercolor",
        name: "Acuarela",
        title: "Acuarela Suave",
        description: "Delicadas pinceladas en tonos pastel que evocan los cuentos clásicos. Perfecto para historias mágicas y soñadoras.",
        color: "#EC4899",
        bgGradient: "from-pink-400 to-rose-500",
        sampleImage: "/stories/forest-1.jpg",
        features: ["Tonos pastel suaves", "Texturas artísticas", "Ambiente soñador"],
    },
    {
        id: "vector",
        name: "Vector Moderno",
        title: "Ilustración Moderna",
        description: "Líneas limpias y colores planos con un estilo fresco y contemporáneo. Ideal para niños de todas las edades.",
        color: "#06B6D4",
        bgGradient: "from-cyan-400 to-teal-500",
        sampleImage: "/stories/soccer-1.jpg",
        features: ["Diseño moderno", "Colores brillantes", "Formas geométricas"],
    },
    {
        id: "cartoon",
        name: "Caricatura",
        title: "Caricatura Clásica",
        description: "El encanto de los dibujos animados clásicos con un toque divertido. Expresiones exageradas que los niños adoran.",
        color: "#F59E0B",
        bgGradient: "from-amber-400 to-orange-500",
        sampleImage: "/stories/dino-1.jpg",
        features: ["Expresiones divertidas", "Estilo dinámico", "Alta energía"],
    },
]

interface ArtStylesSectionProps {
    className?: string
    onSelectStyle?: (styleId: string) => void
}

export function ArtStylesSection({ className = "", onSelectStyle }: ArtStylesSectionProps) {
    const [selectedStyle, setSelectedStyle] = useState<string | null>(null)
    const [hoveredStyle, setHoveredStyle] = useState<string | null>(null)

    const handleSelect = (styleId: string) => {
        setSelectedStyle(styleId)
        onSelectStyle?.(styleId)
    }

    return (
        <section className={`py-24 bg-cream-50 ${className}`}>
            <div className="container mx-auto px-6">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-4">
                        <Palette className="w-4 h-4" />
                        Estilos Artísticos
                    </span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-charcoal-900 mb-4">
                        Elige el <span className="text-coral-500">estilo perfecto</span>
                    </h2>
                    <p className="text-charcoal-600 text-lg max-w-2xl mx-auto">
                        Cada estilo está cuidadosamente diseñado para dar vida a tu historia
                    </p>
                </motion.div>

                {/* Styles grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {ART_STYLES.map((style, index) => (
                        <motion.div
                            key={style.id}
                            className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all ${selectedStyle === style.id
                                ? "ring-4 ring-coral-500 ring-offset-4"
                                : ""
                                }`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            onClick={() => handleSelect(style.id)}
                            onMouseEnter={() => setHoveredStyle(style.id)}
                            onMouseLeave={() => setHoveredStyle(null)}
                        >
                            {/* Background gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${style.bgGradient} opacity-90`} />

                            {/* Animated pattern overlay */}
                            <motion.div
                                className="absolute inset-0 opacity-20"
                                style={{
                                    backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                                    backgroundSize: "24px 24px",
                                }}
                                animate={{
                                    backgroundPosition: hoveredStyle === style.id ? ["0px 0px", "24px 24px"] : "0px 0px",
                                }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Content */}
                            <div className="relative p-6 text-white min-h-[280px] flex flex-col">
                                {/* Style image */}
                                <div className="mb-6 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20 aspect-square relative group-hover:scale-105 transition-transform duration-500">
                                    <img
                                        src={style.sampleImage}
                                        alt={style.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                </div>

                                <h3 className="text-xl font-bold mb-2">{style.title}</h3>
                                <p className="text-white/80 text-sm mb-4 flex-1">
                                    {style.description}
                                </p>

                                {/* Features */}
                                <div className="space-y-1">
                                    {style.features.map((feature) => (
                                        <div key={feature} className="flex items-center gap-2 text-xs text-white/90">
                                            <Sparkles className="w-3 h-3" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Preview button on hover */}
                                <AnimatePresence>
                                    {hoveredStyle === style.id && (
                                        <motion.div
                                            className="absolute bottom-6 right-6"
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                        >
                                            <div className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                                                <Eye className="w-3 h-3" />
                                                Ver ejemplo
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Selected indicator */}
                                {selectedStyle === style.id && (
                                    <motion.div
                                        className="absolute top-4 right-4 w-6 h-6 bg-white rounded-full flex items-center justify-center"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                    >
                                        <svg className="w-4 h-4 text-coral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Before/After teaser */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    <p className="text-charcoal-600 mb-4">
                        ¿Quieres ver cómo quedará tu foto en cada estilo?
                    </p>
                    <motion.button
                        className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white rounded-full font-semibold transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Sparkles className="w-5 h-5" />
                        Probar con mi foto
                    </motion.button>
                </motion.div>
            </div>
        </section>
    )
}

export default ArtStylesSection
