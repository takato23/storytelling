"use client"

import React from "react"
import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { STORIES } from "@/lib/stories"
import { Heart, Shield, Zap, Star, Smile, BookOpen } from "lucide-react"
import { Footer } from "@/components/layout/Footer"

export default function ThemesPage() {
    // Extract unique themes from all stories
    const allThemeLabels = Array.from(new Set(STORIES.flatMap(s => s.themes.map(t => t.label))));

    // Create sections for popular themes
    // Based on data: "Valentía", "Curiosidad", "Imaginación", "Amistad", "Naturaleza", "Magia", "Diversión", "Empatía", "Aventura", "Esfuerzo", "Éxito", "Equipo"

    const themeGroups = [
        {
            title: "Valores y Emociones",
            description: "Cuentos para aprender sobre la amistad, empatía y valentía.",
            keywords: ["Amistad", "Empatía", "Valentía", "Esfuerzo", "Equipo"],
            color: "text-coral-500"
        },
        {
            title: "Fantasía y Magia",
            description: "Mundos increíbles donde todo es posible.",
            keywords: ["Magia", "Imaginación", "Fantasía"],
            color: "text-purple-500"
        },
        {
            title: "Exploración y Naturaleza",
            description: "Descubriendo el mundo y el universo.",
            keywords: ["Naturaleza", "Aventura", "Curiosidad", "Diversión"],
            color: "text-teal-500"
        }
    ];

    return (
        <main className="min-h-screen bg-cream-50 pt-24">
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-yellow-100 text-yellow-700 text-sm font-medium mb-4">
                        Por Temas
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal-900 mb-6">
                        Historias que <span className="text-yellow-500">Inspiran</span>
                    </h1>
                    <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
                        Busca cuentos basados en los intereses de tu hijo o en los valores que quieres transmitir.
                    </p>
                </div>

                <div className="space-y-20">
                    {themeGroups.map((group) => {
                        // Filter stories that have at least one theme matching the keywords
                        const groupStories = STORIES.filter(s =>
                            s.themes.some(t => group.keywords.includes(t.label))
                        );

                        if (groupStories.length === 0) return null;

                        return (
                            <div key={group.title} id={group.title.toLowerCase().split(' ')[0]} className="scroll-mt-24">
                                <div className="text-center md:text-left mb-8">
                                    <h2 className={`text-3xl font-bold ${group.color} mb-2`}>
                                        {group.title}
                                    </h2>
                                    <p className="text-charcoal-600">{group.description}</p>
                                </div>
                                <StoryCatalog
                                    stories={groupStories}
                                    title={null}
                                    subtitle=""
                                    className="!py-0"
                                />
                                <div className="my-12 border-b border-charcoal-100 w-full"></div>
                            </div>
                        )
                    })}
                </div>
            </div>
            <Footer />
        </main>
    )
}
