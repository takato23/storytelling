"use client"

import React from "react"
import { Footer } from "@/components/layout/Footer"

import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { STORIES } from "@/lib/stories"

export default function BooksPage() {
    return (
        <main className="play-pattern min-h-screen pt-24">
            <div className="container mx-auto px-6 py-12">
                <div className="play-hero-panel mx-auto mb-16 max-w-5xl px-6 py-10 text-center md:px-10">
                    <span className="play-kicker mb-4">
                        Colección Completa
                    </span>
                    <h1 className="play-hero-title mb-6 text-4xl font-black tracking-tight md:text-5xl lg:text-6xl">
                        Nuestros <span className="text-white">Libros Mágicos</span>
                    </h1>
                    <p className="play-hero-copy mx-auto max-w-2xl text-lg font-semibold md:text-xl">
                        Explora nuestra colección completa de aventuras personalizadas.
                        Cada historia es única, como tu pequeño.
                    </p>
                </div>

                <StoryCatalog
                    stories={STORIES}
                    title={null}
                    subtitle=""
                    className="!bg-transparent !py-0"
                />
            </div>
            <Footer />
        </main>
    )
}
