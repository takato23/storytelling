"use client"

import React, { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Camera, Eye, User } from "lucide-react"
import { type ReadingLevel } from "@/components/features/education/ReadingLevelSelector"
import { type PrintConfig } from "@/components/features/print/PrintConfigurator"
import { SkeletonLoader } from "@/components/ui/SkeletonLoader"
import { WizardBackground3D } from "@/components/story-wizard/WizardBackground3D"
import { MagicalButton } from "@/components/ui/MagicalButton"
import { resolveStoryIdFromParam } from "@/lib/stories"
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

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
        reader.readAsDataURL(file)
    })
}

function StoryWizardContent() {
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

    const [printConfig, setPrintConfig] = useState<PrintConfig>({
        coverType: "soft",
        paperType: "standard",
        giftBox: false,
    })

    const progressPercentage = Math.round((currentStep / STEPS.length) * 100)
    const activeStep = STEPS.find((step) => step.id === currentStep)

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
        captureEvent("wizard_step_view", {
            step_id: currentStep,
            step_name: activeStep?.title ?? `Paso ${currentStep}`,
            is_gift: false,
        })
    }, [currentStep, activeStep])

    const handleImageSelect = async (file: File | null) => {
        setImage(file)
        setGeneratedPreview(null)

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

        setIsGenerating(true)
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
            if (payload.success) {
                setGeneratedPreview({
                    imageUrl: payload.imageUrl,
                    sceneText: payload.sceneText,
                })
                captureEvent("preview_generated", {
                    story_id: selectedStory,
                    style_id: selectedStyle ?? "pixar",
                })
            }
        } catch (error) {
            console.error("Preview generation failed", error)
        } finally {
            setIsGenerating(false)
        }
    }, [image, selectedStory, childFeatures, childAge, childGender, selectedStyle])

    useEffect(() => {
        if (currentStep !== 4) return
        if (generatedPreview || isGenerating) return
        if (!image || !selectedStory) return
        void generatePreviewImage()
    }, [currentStep, generatedPreview, isGenerating, image, selectedStory, generatePreviewImage])

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
        <div className="min-h-screen pt-4 pb-36 md:pb-10 relative overflow-hidden wizard-clarity">
            <WizardBackground3D step={currentStep} />

            <div className="wizard-gradient-orb wizard-orb-a w-96 h-96 bg-gradient-to-br from-cyan-300/60 to-indigo-400/60 -top-20 -left-20" />
            <div className="wizard-gradient-orb wizard-orb-b w-[28rem] h-[28rem] bg-gradient-to-br from-purple-300/50 to-fuchsia-300/45 -bottom-28 -right-24" />

            <div className="container mx-auto px-3 sm:px-4 py-4 max-w-5xl relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="wizard-liquid-shell wizard-liquid-sheen wizard-noise rounded-[34px] p-5 sm:p-6 lg:p-8 overflow-hidden"
                >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-3">
                        <div className="flex items-center justify-between sm:justify-start gap-3">
                            <Link
                                href="/"
                                className="group wizard-liquid-pill flex items-center gap-2 px-4 py-2.5 rounded-full text-charcoal-700 hover:text-charcoal-900 transition-all hover:scale-[1.03]"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span className="text-sm font-semibold">Cancelar</span>
                            </Link>

                            <div className="wizard-liquid-pill px-3.5 py-2 rounded-full text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-indigo-700/90">
                                Paso {currentStep} de {STEPS.length}
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <p className="text-sm text-charcoal-600">
                            <span className="font-semibold text-charcoal-800">{activeStep?.title}:</span>{" "}
                            {activeStep?.description}
                        </p>
                        <div className="wizard-liquid-pill px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-700/90 w-fit">
                            Progreso {progressPercentage}%
                        </div>
                    </div>

                    <StepIndicator currentStep={currentStep} steps={STEPS} />

                    <div className="mb-6 px-1">
                        <div className="h-1.5 rounded-full bg-white/40 border border-white/50 overflow-hidden">
                            <motion.div
                                className="relative h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 shadow-[0_0_18px_rgba(99,102,241,0.45)]"
                                initial={{ width: `${Math.max((currentStep - 1) * 10, 0)}%` }}
                                animate={{ width: `${progressPercentage}%` }}
                                transition={{ duration: 0.45, ease: "easeOut" }}
                            >
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]" />
                            </motion.div>
                        </div>
                    </div>

                    <div className="wizard-liquid-panel wizard-liquid-sheen rounded-[28px] px-4 py-6 sm:px-6 md:px-8 md:py-8 pb-28 md:pb-8">
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
                                />
                            )}
                        </motion.div>
                    </div>

                    <motion.div
                        className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 z-50 md:static md:p-0 md:mt-8"
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.75rem)" }}
                    >
                        <div className="max-w-md md:max-w-5xl mx-auto flex justify-between items-center wizard-liquid-shell wizard-liquid-sheen rounded-[24px] p-3 sm:p-4 md:rounded-[20px]">
                            <button
                                onClick={handleBack}
                                disabled={currentStep === 1}
                                className={`
                                wizard-liquid-pill px-4 sm:px-6 py-3.5 rounded-full font-semibold flex items-center gap-2 transition-all duration-300 text-sm sm:text-base
                                ${currentStep === 1
                                        ? "text-charcoal-300 cursor-not-allowed opacity-50"
                                        : "text-charcoal-700 hover:text-indigo-700 hover:scale-[1.03]"
                                    }
                            `}
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span className="hidden md:inline">Anterior</span>
                            </button>

                            {currentStep < STEPS.length && (
                                <MagicalButton
                                    onClick={handleNext}
                                    disabled={Boolean(blockingReason)}
                                    text={currentStep === STEPS.length - 1 ? "Ver Resultado Mágico" : "Siguiente Paso"}
                                    variant="primary"
                                    className="!bg-gradient-to-r !from-indigo-500 !via-violet-500 !to-cyan-500 !shadow-[0_20px_40px_-22px_rgba(79,70,229,0.9)] !text-white"
                                />
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    )
}

export default function CreateStoryPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-[#f5f0eb]">
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
