"use client"

import React from "react"
import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { STORIES } from "@/lib/stories"
import { Footer } from "@/components/layout/Footer"

export default function AgesPage() {
    // Unique age groups (simple string matching for now)
    const ageGroups = ["0-3 años", "3-6 años", "4-8 años", "6-9 años", "+9 años"]

    // Group stories (rough grouping since ages in STORIES are strings like "4-8 años")
    // A better approach would be to have min/max age in data, but we'll map string to string for now.

    // Let's iterate over specific display categories and filter loose matches
    const categories = [
        { label: "Primeros Pasos (0-3 años)", filter: "0-3" },
        { label: "Preescolar (3-6 años)", filter: "3-6" }, // Also inclusive of 3-7, 4-8 etc overlapping
        { label: "Lectores (6+ años)", filter: "6" }, // Matches 6-9, +9, 5-10
    ]

    const getStoriesForAge = (filter: string) => {
        return STORIES.filter(s => s.ages.includes(filter) || (filter === "6" && (s.ages.includes("5-10") || s.ages.includes("6-9") || s.ages.includes("+9"))));
    }

    // Since the dataset is small, I will manually curate sections based on the existing data.
    // Existing data (Step 26):
    // 1. "4-8 años"
    // 2. "3-7 años"
    // 3. "4-8 años"
    // 4. "5-10 años"

    // Seems like "3-6" and "4-8" and "5-10" are the main buckets.
    const sections = [
        {
            title: "Pequeños Soñadores (3-6 años)",
            stories: STORIES.filter(s => s.ages === "3-7 años" || s.ages === "0-3 años")
        },
        {
            title: "Aventureros (4-8 años)",
            stories: STORIES.filter(s => s.ages === "4-8 años")
        },
        {
            title: "Grandes Lectores (5+ años)",
            stories: STORIES.filter(s => s.ages === "5-10 años" || s.ages === "+9 años" || s.ages === "6-9 años")
        }
    ].filter(s => s.stories.length > 0);


    return (
        <main className="min-h-screen bg-cream-50 pt-24">
            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-teal-100 text-teal-700 text-sm font-medium mb-4">
                        Por Edades
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal-900 mb-6">
                        Cuentos para <span className="text-teal-500">Cada Etapa</span>
                    </h1>
                    <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
                        Encuentra la historia perfecta adecuada al nivel de desarrollo e intereses de tu peque.
                    </p>
                </div>

                <div className="space-y-16">
                    {sections.map((section) => (
                        <div key={section.title} id={section.title.toLowerCase().split(' ')[0] === "pequeños" ? "0-3" : section.title.toLowerCase().includes("aventureros") ? "3-6" : "6-9"} className="scroll-mt-24">
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-charcoal-800">
                                    {section.title}
                                </h2>
                                <div className="h-px bg-charcoal-200 flex-grow"></div>
                            </div>
                            <StoryCatalog
                                stories={section.stories}
                                title={null}
                                subtitle=""
                                className="!py-0"
                            />
                        </div>
                    ))}

                    {sections.length === 0 && (
                        <StoryCatalog stories={STORIES} title="Todos los cuentos" />
                    )}
                </div>
            </div>
            <Footer />
        </main>
    )
}
