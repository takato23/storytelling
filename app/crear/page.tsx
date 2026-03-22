"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Camera, Eye, Sparkles, User } from "lucide-react"
import { type ReadingLevel } from "@/components/features/education/ReadingLevelSelector"
import { DEFAULT_PRINT_CONFIG, type PrintConfig } from "@/components/features/print/PrintConfigurator"
import { SkeletonLoader } from "@/components/ui/SkeletonLoader"
import { MagicalButton } from "@/components/ui/MagicalButton"
import { resolveStoryIdFromParam, STORIES } from "@/lib/stories"
import { PhotoUploadStep } from "@/components/story-wizard/PhotoUploadStep"
import { CharacterStep } from "@/components/story-wizard/CharacterStep"
import { StorySelectionStep } from "@/components/story-wizard/StorySelectionStep"
import { PreviewStep } from "@/components/story-wizard/PreviewStep"
import { StepIndicator } from "@/components/story-wizard/StepIndicator"
import { captureEvent } from "@/lib/analytics/events"

interface ChildFeatures {
    approximateAge?: number
    [key: string]: unknown
}

interface PreviewPayload {
    imageUrl: string
    sceneText: string
}

interface WizardSavedState {
    step?: number
    childName?: string
    childAge?: number
    childGender?: string
    selectedStory?: string | null
    readingLevel?: ReadingLevel
}

const STEPS = [
    { id: 1, title: "Foto", icon: Camera, description: "Sube la foto del niño/a" },
    { id: 2, title: "Personaje", icon: User, description: "Nombre y datos del protagonista" },
    { id: 3, title: "Historia", icon: BookOpen, description: "Elige el cuento" },
    { id: 4, title: "Vista previa", icon: Eye, description: "Revisa y pasa al checkout" },
]
const MAX_PREVIEW_ATTEMPTS = 2

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
        reader.readAsDataURL(file)
    })
}

function StoryWizardContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const initialStory = resolveStoryIdFromParam(searchParams.get("story"))

    const [currentStep, setCurrentStep] = useState(1)
    const [image, setImage] = useState<File | null>(null)
    const [childName, setChildName] = useState("")
    const [childAge, setChildAge] = useState(6)
    const [childGender, setChildGender] = useState("neutral")
    const [selectedStory, setSelectedStory] = useState<string | null>(initialStory)
    const [selectedStyle] = useState<string | null>("pixar")
    const [readingLevel, setReadingLevel] = useState<ReadingLevel>("intermediate")

    const [childFeatures, setChildFeatures] = useState<ChildFeatures | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)
    const [generatedPreview, setGeneratedPreview] = useState<PreviewPayload | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [previewAttemptsRemaining, setPreviewAttemptsRemaining] = useState(MAX_PREVIEW_ATTEMPTS)

    const [printConfig, setPrintConfig] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG)

    const progressPercentage = Math.round((currentStep / STEPS.length) * 100)
    const activeStep = STEPS.find((step) => step.id === currentStep)
    const selectedStoryData = useMemo(
        () => STORIES.find((story) => story.id === selectedStory) ?? null,
        [selectedStory]
    )
    const isPreviewStep = currentStep === 4

    useEffect(() => {
        const savedState = localStorage.getItem("storymagic_wizard_state")
        if (!savedState) return

        try {
            const parsed: WizardSavedState = JSON.parse(savedState)
            if (parsed.step && parsed.step >= 1 && parsed.step <= STEPS.length) setCurrentStep(parsed.step)
            if (parsed.childName) setChildName(parsed.childName)
            if (parsed.childAge) setChildAge(parsed.childAge)
            if (parsed.childGender) setChildGender(parsed.childGender)
            if (parsed.selectedStory) setSelectedStory(resolveStoryIdFromParam(parsed.selectedStory))
            if (parsed.readingLevel) setReadingLevel(parsed.readingLevel)
        } catch {
            // Ignore malformed local state
        }
    }, [])

    useEffect(() => {
        const state: WizardSavedState = {
            step: currentStep,
            childName,
            childAge,
            childGender,
            selectedStory,
            readingLevel,
        }
        localStorage.setItem("storymagic_wizard_state", JSON.stringify(state))
    }, [currentStep, childName, childAge, childGender, selectedStory, readingLevel])

    useEffect(() => {
        setGeneratedPreview(null)
        setPreviewError(null)
        setPreviewAttemptsRemaining(MAX_PREVIEW_ATTEMPTS)
    }, [selectedStory])

    useEffect(() => {
        captureEvent("wizard_step_view", {
            step_id: currentStep,
            step_name: activeStep?.title ?? `Paso ${currentStep}`,
            is_gift: false,
        })
    }, [currentStep, activeStep])

    const handleImageSelect = async (file: File | null) => {
        setImage(file)
        setGeneratedPreview(null)
        setPreviewError(null)
        setPreviewAttemptsRemaining(MAX_PREVIEW_ATTEMPTS)

        if (!file) {
            setChildFeatures(null)
            return
        }

        setIsAnalyzing(true)
        try {
            const imageBase64 = await fileToDataUrl(file)
            const response = await fetch("/api/personalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "analyze",
                    imageBase64,
                }),
            })
            const payload = await response.json()
            if (payload.success && payload.features) {
                setChildFeatures(payload.features as ChildFeatures)
                if (typeof payload.features.approximateAge === "number") {
                    setChildAge(payload.features.approximateAge)
                }
            }
        } catch (error) {
            console.error("Analyze failed", error)
        } finally {
            setIsAnalyzing(false)
        }
    }

    const generatePreviewImage = useCallback(async () => {
        if (!image || !selectedStory) return
        if (previewAttemptsRemaining <= 0) return

        const nextAttempt = Math.max(
            1,
            MAX_PREVIEW_ATTEMPTS - previewAttemptsRemaining + 1,
        )

        setPreviewAttemptsRemaining((prev) => prev - 1)
        setIsGenerating(true)
        setPreviewError(null)
        try {
            const imageBase64 = await fileToDataUrl(image)
            const response = await fetch("/api/personalize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "generate",
                    imageBase64,
                    bookId: selectedStory,
                    childFeatures: childFeatures ?? {
                        approximateAge: childAge,
                        gender: childGender,
                    },
                }),
            })
            const payload = await response.json()

            if (response.status === 401) {
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos generar la preview en este momento.")
            }

            if (payload.success) {
                setGeneratedPreview({
                    imageUrl: payload.imageUrl,
                    sceneText: payload.sceneText,
                })
                captureEvent("preview_generated", {
                    story_id: selectedStory,
                    style_id: selectedStyle ?? "pixar",
                    preview_attempt: nextAttempt,
                    preview_attempts_remaining: previewAttemptsRemaining - 1,
                })
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : "No pudimos generar la preview."
            setPreviewError(message)
            console.error("Preview generation failed", error)
        } finally {
            setIsGenerating(false)
        }
    }, [
        image,
        selectedStory,
        childFeatures,
        childAge,
        childGender,
        selectedStyle,
        previewAttemptsRemaining,
        router,
    ])

    useEffect(() => {
        if (currentStep !== 4) return
        if (generatedPreview || isGenerating) return
        if (!image || !selectedStory) return
        if (previewAttemptsRemaining <= 0) return
        void generatePreviewImage()
    }, [currentStep, generatedPreview, isGenerating, image, selectedStory, previewAttemptsRemaining, generatePreviewImage])

    const blockingReason = useMemo(() => {
        if (currentStep === 1 && !image) return "missing_photo"
        if (currentStep === 2 && childName.trim().length < 2) return "missing_child_name"
        if (currentStep === 3 && !selectedStory) return "missing_story"
        return null
    }, [currentStep, image, childName, selectedStory])

    useEffect(() => {
        if (!blockingReason) return
        captureEvent("wizard_step_blocked", {
            step_id: currentStep,
            reason: blockingReason,
        })
    }, [blockingReason, currentStep])

    const handleNext = () => {
        if (currentStep >= STEPS.length) return
        if (blockingReason) {
            captureEvent("wizard_step_blocked", {
                step_id: currentStep,
                reason: blockingReason,
            })
            return
        }

        captureEvent("wizard_step_completed", {
            step_id: currentStep,
            step_name: activeStep?.title ?? `Paso ${currentStep}`,
        })
        setCurrentStep((prev) => prev + 1)
    }

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => prev - 1)
        }
    }

    const handleCharacterUpdate = (field: string, value: string | number) => {
        if (field === "childName") setChildName(String(value))
        if (field === "childAge") setChildAge(Number(value))
        if (field === "childGender") setChildGender(String(value))
    }

    return (
        <div className="play-pattern relative min-h-screen overflow-hidden pb-28 pt-28 md:pb-12 wizard-clarity">
            <div className="pointer-events-none absolute left-4 top-16 h-48 w-48 rounded-full bg-[var(--play-primary-container)]/20 blur-[90px]" />
            <div className="pointer-events-none absolute bottom-10 right-6 h-56 w-56 rounded-full bg-[var(--play-tertiary-container)]/25 blur-[100px]" />

            <div className={`container relative z-10 mx-auto px-4 py-4 ${isPreviewStep ? "max-w-[1500px]" : "max-w-7xl"}`}>
                <div className="mb-6 text-center lg:text-left">
                    <div className="play-kicker mb-4 inline-flex">
                        <Sparkles className="h-4 w-4" />
                        Crea tu cuento
                    </div>
                    <h1 className="play-title text-4xl md:text-5xl">Escribe tu mensaje mágico</h1>
                    <p className="play-copy mt-3 max-w-2xl text-base font-medium md:text-lg">
                        Personaliza el libro en pocos pasos y revisa todo antes de pagar.
                    </p>
                </div>

                <div className={`grid gap-6 lg:items-start ${isPreviewStep ? "grid-cols-1" : "lg:grid-cols-[minmax(0,1fr)_320px]"}`}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`wizard-liquid-shell wizard-liquid-sheen wizard-noise overflow-hidden rounded-[34px] p-5 sm:p-6 ${isPreviewStep ? "lg:p-6 xl:p-8" : "lg:p-8"}`}
                    >
                        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-center justify-between gap-3 sm:justify-start">
                                <Link
                                    href="/"
                                    className="play-pill group flex items-center gap-2 px-4 py-2.5"
                                >
                                    <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                                    <span className="text-sm font-semibold">Cancelar</span>
                                </Link>

                                <div className="play-pill px-3.5 py-2 text-[11px] sm:text-xs">
                                    Paso {currentStep} de {STEPS.length}
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-sm text-[var(--play-text-muted)]">
                                <span className="font-semibold text-[var(--play-text-main)]">{activeStep?.title}:</span>{" "}
                                {activeStep?.description}
                            </p>
                            <div className="play-pill w-fit px-3 py-1.5 text-[11px]">
                                Progreso {progressPercentage}%
                            </div>
                        </div>

                        <StepIndicator currentStep={currentStep} steps={STEPS} />

                        <div className="mb-6 px-1">
                            <div className="h-2 overflow-hidden rounded-full bg-white/60 border border-white/70">
                                <motion.div
                                    className="relative h-full rounded-full bg-[linear-gradient(90deg,var(--play-primary),#2d83dd,var(--play-primary-container))]"
                                    initial={{ width: `${Math.max((currentStep - 1) * 10, 0)}%` }}
                                    animate={{ width: `${progressPercentage}%` }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                >
                                    <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-white shadow-sm" />
                                </motion.div>
                            </div>
                        </div>

                        <div className={`wizard-liquid-panel wizard-liquid-sheen rounded-[28px] px-4 py-6 sm:px-6 md:px-8 md:py-8 ${isPreviewStep ? "pb-8" : "pb-28 md:pb-8"}`}>
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 24 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.32 }}
                            >
                                {currentStep === 1 && (
                                    <PhotoUploadStep
                                        image={image}
                                        onImageSelect={handleImageSelect}
                                        childFeatures={childFeatures}
                                        isAnalyzing={isAnalyzing}
                                    />
                                )}
                                {currentStep === 2 && (
                                    <CharacterStep
                                        childName={childName}
                                        childAge={childAge}
                                        childGender={childGender}
                                        onUpdate={handleCharacterUpdate}
                                    />
                                )}
                                {currentStep === 3 && (
                                    <StorySelectionStep
                                        selectedStory={selectedStory}
                                        onSelect={setSelectedStory}
                                        readingLevel={readingLevel}
                                        onLevelSelect={setReadingLevel}
                                    />
                                )}
                                {currentStep === 4 && (
                                    <PreviewStep
                                        data={{
                                            image,
                                            childName,
                                            childAge,
                                            childGender,
                                            childFeatures,
                                            readingLevel,
                                            selectedStory,
                                            selectedStyle,
                                            familyMembers: [],
                                            giftData: {
                                                type: "digital",
                                                message: "",
                                                senderName: "",
                                                recipientName: "",
                                                scheduledDate: "",
                                                scheduledTime: "",
                                            },
                                            isGift: false,
                                        }}
                                        printConfig={printConfig}
                                        onPrintConfigChange={setPrintConfig}
                                        isGenerating={isGenerating}
                                        generatedPreview={generatedPreview}
                                        previewError={previewError}
                                    />
                                )}
                            </motion.div>
                        </div>

                        <motion.div
                            className="fixed bottom-0 left-0 right-0 z-50 p-3 sm:p-4 md:static md:mt-8 md:p-0"
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
                        >
                            <div className="mx-auto flex max-w-md items-center justify-between rounded-[24px] bg-white/92 p-3 shadow-[0_18px_40px_-24px_rgba(0,93,167,0.22)] md:max-w-none md:rounded-[20px] md:border md:border-[var(--play-outline)] md:bg-white/82 sm:p-4">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1}
                                    className={`play-pill px-4 py-3 sm:px-6 sm:py-3.5 ${currentStep === 1 ? "cursor-not-allowed opacity-50" : "hover:text-[var(--play-primary)]"}`}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    <span className="hidden md:inline">Anterior</span>
                                </button>

                                {currentStep < STEPS.length && (
                                    <MagicalButton
                                        onClick={handleNext}
                                        disabled={Boolean(blockingReason)}
                                        text={currentStep === STEPS.length - 1 ? "Ver obra maestra" : "Siguiente paso"}
                                        variant="primary"
                                        className="!bg-[var(--play-primary)] !text-white !shadow-[0_14px_28px_rgba(0,93,167,0.24)]"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </motion.div>

                    {!isPreviewStep && (
                    <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-28">
                        <div className="play-panel p-5">
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">
                                Resumen
                            </p>
                            <div className="space-y-3 text-sm font-medium text-[var(--play-text-muted)]">
                                <div className="flex items-center justify-between">
                                    <span>Paso actual</span>
                                    <span className="font-bold text-[var(--play-text-main)]">{activeStep?.title}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Progreso</span>
                                    <span className="font-bold text-[var(--play-text-main)]">{progressPercentage}%</span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-[var(--play-surface-low)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--play-primary)]"
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="play-panel-soft p-5">
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">
                                Tu cuento
                            </p>
                            {selectedStoryData ? (
                                <div className="space-y-3">
                                    <div className="overflow-hidden rounded-[22px]">
                                        <img src={selectedStoryData.coverImage} alt={selectedStoryData.title} className="aspect-[4/3] w-full object-cover" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black text-[var(--play-text-main)]">{selectedStoryData.title}</h3>
                                        <p className="mt-1 text-sm font-medium text-[var(--play-text-muted)]">{selectedStoryData.shortDescription}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm font-medium text-[var(--play-text-muted)]">
                                    Cuando elijas una historia aparecerá acá para revisar el resultado final.
                                </p>
                            )}
                        </div>

                        <div className="play-panel-soft p-5">
                            <p className="mb-3 text-xs font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">
                                Detalles
                            </p>
                            <div className="space-y-2 text-sm font-medium text-[var(--play-text-muted)]">
                                <div className="flex items-center justify-between">
                                    <span>Protagonista</span>
                                    <span className="font-bold text-[var(--play-text-main)]">{childName || "Pendiente"}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Edad</span>
                                    <span className="font-bold text-[var(--play-text-main)]">{childAge} años</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Nivel</span>
                                    <span className="font-bold text-[var(--play-text-main)]">{readingLevel}</span>
                                </div>
                            </div>
                        </div>
                    </aside>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function CreateStoryPage() {
    return (
        <Suspense
            fallback={
                <div className="page-shell min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <SkeletonLoader variant="circular" className="w-24 h-24 shadow-xl" />
                            <div className="absolute inset-0 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin" />
                        </div>
                    </div>
                </div>
            }
        >
            <StoryWizardContent />
        </Suspense>
    )
}
