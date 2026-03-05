"use client"

import React from "react"
import { motion } from "framer-motion"
import { Check, type LucideIcon } from "lucide-react"

interface StepIndicatorProps {
    currentStep: number
    steps: {
        id: number
        title: string
        icon: LucideIcon
    }[]
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
    return (
        <div className="w-full overflow-x-auto pb-4 pt-1 px-1 mb-1 scrollbar-hide">
            <div className="flex items-center justify-start md:justify-center gap-2 md:gap-3 min-w-max mx-auto px-2 sm:px-4">
                {steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                        <motion.div
                            className="relative flex flex-col items-center group cursor-default min-w-[64px]"
                            animate={step.id === currentStep ? { y: -2, scale: 1.04 } : { y: 0, scale: 1 }}
                            transition={{ duration: 0.28 }}
                        >
                            {/* Active Glow */}
                            {step.id === currentStep && (
                                <motion.div
                                    layoutId="stepGlow"
                                    className="absolute inset-0 rounded-2xl bg-indigo-400/30 blur-lg"
                                    transition={{ duration: 0.5 }}
                                />
                            )}

                            {step.id === currentStep && (
                                <motion.div
                                    className="absolute -inset-1 rounded-2xl border border-indigo-300/60"
                                    animate={{ opacity: [0.2, 0.8, 0.2] }}
                                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                                />
                            )}

                            <motion.div
                                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 z-10 ${step.id < currentStep
                                    ? "wizard-step-dot-complete text-white"
                                    : step.id === currentStep
                                        ? "wizard-step-dot-active text-white"
                                        : "wizard-step-dot text-charcoal-500"
                                    }`}
                            >
                                {step.id < currentStep ? (
                                    <Check className="w-6 h-6 stroke-[3px]" />
                                ) : (
                                    <step.icon className={`w-5 h-5 ${step.id === currentStep ? "stroke-[2.4px]" : "stroke-[2px]"}`} />
                                )}
                            </motion.div>

                            <span className={`mt-2.5 text-[10px] font-extrabold uppercase tracking-[0.16em] transition-colors ${step.id === currentStep ? "text-indigo-700 block" : "text-charcoal-500/75 hidden sm:block"
                                }`}>
                                {step.title}
                            </span>
                        </motion.div>

                        {/* Connector line */}
                        {index < steps.length - 1 && (
                            <div className="relative w-7 md:w-14 h-1 rounded-full bg-white/30 border border-white/40 overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500"
                                    initial={false}
                                    animate={{
                                        scaleX: step.id < currentStep ? 1 : 0
                                    }}
                                    style={{ originX: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    )
}
