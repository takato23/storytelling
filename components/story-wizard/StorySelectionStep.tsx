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
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--play-primary)] mb-3">Paso 3 de 4</p>
                <h2 className="play-title text-3xl md:text-4xl mb-2">
                    Elige la aventura perfecta
                </h2>
                <p className="play-copy">
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

            <div className="grid gap-6 md:grid-cols-2">
                {STORIES.map((story, index) => (
                    <motion.div
                        key={story.id}
                        onClick={() => onSelect(story.id)}
                        className={`relative rounded-3xl overflow-hidden cursor-pointer transition-all border group ${selectedStory === story.id
                            ? "border-[var(--play-primary)] bg-[var(--play-primary-container)]/16 ring-4 ring-[var(--play-primary-container)]/20 shadow-[0_22px_38px_-24px_rgba(0,93,167,0.32)] scale-[1.015]"
                            : "play-card-soft hover:-translate-y-0.5 hover:border-[var(--play-primary)]/35 hover:shadow-[0_20px_36px_-24px_rgba(0,93,167,0.22)]"
                            }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <div className="p-6 flex flex-col h-full relative z-10">
                            <div className="flex items-start gap-5">
                                <motion.div
                                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--play-surface-low)] text-5xl shadow-sm"
                                    animate={selectedStory === story.id ? { rotate: [0, 5, -5, 0], scale: 1.08 } : {}}
                                    transition={{ duration: 0.5 }}
                                >
                                    {story.icon}
                                </motion.div>
                                <div className="flex-1">
                                    <h3 className="mb-2 text-xl font-bold leading-tight text-[var(--play-text-main)]">
                                        {story.title}
                                    </h3>
                                    <span className="mb-3 inline-block rounded-full bg-[var(--play-surface-low)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--play-primary)]">
                                        {story.ages}
                                    </span>
                                    <p className="mb-4 text-sm leading-relaxed text-[var(--play-text-muted)]">
                                        {story.shortDescription}
                                    </p>
                                </div>
                            </div>

                            {/* Decorative background blur */}
                            <div className="absolute top-0 right-0 -z-10 h-36 w-36 rounded-full bg-[var(--play-primary-container)]/24 blur-3xl" />
                        </div>

                        {selectedStory === story.id && (
                            <motion.div
                                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--play-primary)] text-white shadow-lg shadow-[rgba(0,93,167,0.25)]"
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
