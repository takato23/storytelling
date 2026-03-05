"use client"

import React from "react"
import { Footer } from "@/components/layout/Footer"

import { StoryCatalog } from "@/components/sections/StoryCatalog"
import { STORIES } from "@/lib/stories"

export default function BooksPage() {
    return (
        <main className="min-h-screen bg-cream-50 pt-24">
            {/* Navbar is global in layout.tsx usually, but checking layout.tsx in Step 6 would confirm. 
              Step 6 showed layout.tsx size 1241 bytes. 
              Usually Navbar is in RootLayout. 
              Let's check layout.tsx content if possible or assume standard Next.js.
              But `page.tsx` didn't have Navbar in it? 
              Wait, `page.tsx` (Step 13) does NOT have <Navbar />. It has <Home />.
              So Navbar is likely in layout.tsx.
              So I don't need to import Navbar here.
           */}

            <div className="container mx-auto px-6 py-12">
                <div className="text-center mb-16">
                    <span className="inline-block px-4 py-2 rounded-full bg-coral-100 text-coral-700 text-sm font-medium mb-4">
                        Colección Completa
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-charcoal-900 mb-6">
                        Nuestros <span className="text-coral-500">Libros Mágicos</span>
                    </h1>
                    <p className="text-xl text-charcoal-600 max-w-2xl mx-auto">
                        Explora nuestra colección completa de aventuras personalizadas.
                        Cada historia es única, como tu pequeño.
                    </p>
                </div>

                <StoryCatalog
                    stories={STORIES}
                    title={null}
                    subtitle=""
                    className="!py-0"
                />
            </div>
            <Footer />
        </main>
    )
}
