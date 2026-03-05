"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { STORIES } from "@/lib/stories"
import { ReadingLevelSelector, ReadingLevel } from "@/components/features/education/ReadingLevelSelector"

interface StorySelectionStepProps {
    selectedStory: string | null
    onSelect: (storyId: string) => void
    readingLevel: ReadingLevel
    onLevelSelect: (level: ReadingLevel) => void
}

export function StorySelectionStep({
    selectedStory,
    onSelect,
    readingLevel,
    onLevelSelect
}: StorySelectionStepProps) {
    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <motion.div
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-indigo-600/85 mb-3">Selección de historia</p>
                <h2 className="text-3xl md:text-4xl font-serif text-charcoal-900 mb-2">
                    Elige la aventura perfecta
                </h2>
                <p className="text-charcoal-600">
                    Cada historia es única y emocionante
                </p>
            </motion.div>

            {/* Reading Level Selector */}
            <div className="wizard-liquid-panel rounded-3xl p-5 md:p-6">
                <ReadingLevelSelector
                    selectedLevel={readingLevel}
                    onSelect={onLevelSelect}
                />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {STORIES.map((story, index) => (
                    <motion.div
                        key={story.id}
                        onClick={() => onSelect(story.id)}
                        className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all border group ${selectedStory === story.id
                            ? "border-indigo-300/80 bg-gradient-to-br from-white to-indigo-50/80 ring-4 ring-indigo-300/20 shadow-[0_22px_38px_-24px_rgba(79,70,229,0.8)] scale-[1.015]"
                            : "wizard-liquid-soft border-white/70 hover:bg-white/75 hover:shadow-[0_20px_36px_-24px_rgba(79,70,229,0.6)] hover:-translate-y-0.5 hover:border-indigo-200/70"
                            }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="p-6 flex flex-col h-full relative z-10">
                            <div className="flex items-start gap-5">
                                <motion.div
                                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-5xl shadow-sm bg-gradient-to-br from-white to-indigo-50 border border-white/90"
                                    animate={selectedStory === story.id ? { rotate: [0, 5, -5, 0], scale: 1.08 } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {story.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-charcoal-900 mb-2 leading-tight">
                                        {story.title}
                                    </h3>
                                    <span className="inline-block px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-md mb-3 border border-indigo-100/80">
                                        {story.ages}
                                    </span>
                                    <p className="text-charcoal-600 text-sm leading-relaxed mb-4">
                                        {story.shortDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Decorative background blur */}
                            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-indigo-200/35 via-sky-200/25 to-cyan-200/25 rounded-full blur-3xl -z-10" />
                        </div>

                        {selectedStory === story.id && (
                            <motion.div
                                className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/35"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                            >
                                <Check className="w-5 h-5 text-white" />
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
