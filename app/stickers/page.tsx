"use client"

import Link from "next/link"
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronDown, ChevronRight, Minus, Plus, Sparkles, Upload } from "lucide-react"
import { Footer } from "@/components/layout/Footer"
import { captureEvent } from "@/lib/analytics/events"
import {
    DEFAULT_STICKER_STYLE_ID,
    STICKER_STYLE_PRESETS,
    STICKER_THEMES_BY_GENDER,
    STICKER_UNIT_PRICE_ARS,
    type StickerGender,
    type StickerStyleId,
} from "@/lib/stickers"

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

function formatArs(value: number) {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("No pudimos leer la imagen"))
        reader.readAsDataURL(file)
    })
}

interface StickerPreviewQualityPayload {
    pass?: boolean
    confidence?: number
    issues?: string[]
    available?: boolean
}

interface CheckoutAvailabilityPayload {
    provider: "mercadopago" | "stripe"
    enabled: boolean
    message: string | null
}

const STICKER_THEME_PACKS: Record<
    StickerGender,
    Array<{ id: string; label: string; themes: string[] }>
> = {
    niña: [
        { id: "aventuras", label: "Pack aventuras", themes: ["Sirena", "Superheroína", "Princesa"] },
        { id: "artes", label: "Pack creativo", themes: ["Guitarrista", "Pintora", "Cocinera"] },
    ],
    niño: [
        { id: "heroes", label: "Pack héroes", themes: ["Superhéroe", "Bombero", "Astronauta"] },
        { id: "explora", label: "Pack explorador", themes: ["Explorador", "Pintor", "Cocinero"] },
    ],
}

/* ── Step indicator labels ── */
const STEPS = [
    { num: 1, label: "Foto" },
    { num: 2, label: "Estilo" },
    { num: 3, label: "Preview" },
]

export default function StickersPage() {
    const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
    const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
    const [childGender, setChildGender] = useState<StickerGender>("niña")
    const [selectedThemes, setSelectedThemes] = useState<string[]>([])
    const [styleId, setStyleId] = useState<StickerStyleId>(DEFAULT_STICKER_STYLE_ID)

    const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null)
    const [generatedPreviewToken, setGeneratedPreviewToken] = useState<string | null>(null)
    const [previewError, setPreviewError] = useState<string | null>(null)
    const [previewQualityWarning, setPreviewQualityWarning] = useState<string | null>(null)
    const [previewAttempts, setPreviewAttempts] = useState(0)
    const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

    const [customerName, setCustomerName] = useState("")
    const [customerEmail, setCustomerEmail] = useState("")
    const [customerPhone, setCustomerPhone] = useState("")
    const [quantity, setQuantity] = useState(1)
    const [isRecipientDifferent, setIsRecipientDifferent] = useState(false)

    const [recipientName, setRecipientName] = useState("")
    const [line1, setLine1] = useState("")
    const [line2, setLine2] = useState("")
    const [city, setCity] = useState("")
    const [state, setState] = useState("")
    const [postalCode, setPostalCode] = useState("")
    const countryCode = "AR"

    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutAvailability, setCheckoutAvailability] = useState<CheckoutAvailabilityPayload | null>(null)

    const [waitlistName, setWaitlistName] = useState("")
    const [waitlistEmail, setWaitlistEmail] = useState("")
    const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false)
    const [waitlistSuccess, setWaitlistSuccess] = useState<string | null>(null)
    const [waitlistError, setWaitlistError] = useState<string | null>(null)

    const [isDragging, setIsDragging] = useState(false)
    const [checkoutOpen, setCheckoutOpen] = useState(false)

    const availableThemes = useMemo(() => STICKER_THEMES_BY_GENDER[childGender], [childGender])
    const subtotalEstimate = useMemo(() => STICKER_UNIT_PRICE_ARS * quantity, [quantity])
    const selectedStyle = STICKER_STYLE_PRESETS[styleId]
    const activeThemePacks = STICKER_THEME_PACKS[childGender]
    const hasPreview = Boolean(generatedPreviewUrl && generatedPreviewToken)
    const selectedThemesLabel = selectedThemes.join(" \u2022 ")
    const checkoutEnabled = checkoutAvailability?.enabled !== false
    const checkoutAvailabilityMessage = checkoutAvailability?.enabled === false
        ? checkoutAvailability.message
        : null

    /* ── Derive current step for indicator ── */
    const currentStep = hasPreview ? 3 : selectedThemes.length > 0 && photoPreviewUrl ? 2 : photoPreviewUrl ? 1 : 0

    useEffect(() => {
        const allowedThemes = new Set<string>(availableThemes)
        setSelectedThemes((current) => {
            const filtered = current.filter((theme) => allowedThemes.has(theme))
            if (filtered.length > 0) return filtered
            return Array.from<string>(availableThemes).slice(0, 2)
        })
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewError(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }, [availableThemes])

    useEffect(() => {
        if (!recipientName && customerName) {
            setRecipientName(customerName)
        }
    }, [customerName, recipientName])

    useEffect(() => {
        return () => {
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl)
            }
        }
    }, [photoPreviewUrl])

    useEffect(() => {
        let cancelled = false

        const loadCheckoutAvailability = async () => {
            try {
                const response = await fetch("/api/checkout/status")
                if (!response.ok) return
                const payload = await response.json()
                if (cancelled) return
                setCheckoutAvailability({
                    provider: payload.provider === "stripe" ? "stripe" : "mercadopago",
                    enabled: payload.enabled !== false,
                    message: typeof payload.message === "string" ? payload.message : null,
                })
            } catch {
                // Keep checkout enabled if the probe fails unexpectedly.
            }
        }

        void loadCheckoutAvailability()

        return () => {
            cancelled = true
        }
    }, [])

    /* Auto-open checkout when preview arrives */
    useEffect(() => {
        if (hasPreview) setCheckoutOpen(true)
    }, [hasPreview])

    const handlePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setPreviewError(null)

        if (!file.type.startsWith("image/")) {
            setPreviewError("Subi una imagen valida (JPG o PNG).")
            return
        }

        if (file.size > MAX_IMAGE_BYTES) {
            setPreviewError("La imagen no puede superar los 5MB.")
            return
        }

        try {
            const dataUrl = await fileToDataUrl(file)
            if (photoPreviewUrl) {
                URL.revokeObjectURL(photoPreviewUrl)
            }
            setPhotoDataUrl(dataUrl)
            setPhotoPreviewUrl(URL.createObjectURL(file))
            setGeneratedPreviewUrl(null)
            setGeneratedPreviewToken(null)
            setPreviewQualityWarning(null)
            setPreviewAttempts(0)
        } catch (error) {
            setPreviewError(error instanceof Error ? error.message : "No pudimos procesar la imagen.")
        }
    }

    const toggleTheme = (theme: string) => {
        setSelectedThemes((current) => {
            if (current.includes(theme)) {
                return current.filter((item) => item !== theme)
            }
            if (current.length >= 6) return current
            return [...current, theme]
        })
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const handleStyleChange = (nextStyleId: StickerStyleId) => {
        setStyleId(nextStyleId)
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const applyThemePack = (themes: string[]) => {
        setSelectedThemes(themes)
        setGeneratedPreviewUrl(null)
        setGeneratedPreviewToken(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
    }

    const changeQuantity = (nextQuantity: number) => {
        setQuantity(Math.max(1, Math.min(10, nextQuantity)))
    }

    const handleGeneratePreview = async () => {
        if (!photoDataUrl) {
            setPreviewError("Subi una foto para generar la previsualizacion.")
            return
        }

        if (selectedThemes.length === 0) {
            setPreviewError("Selecciona al menos una tematica.")
            return
        }

        setPreviewError(null)
        setPreviewQualityWarning(null)
        setPreviewAttempts(0)
        setGeneratedPreviewToken(null)
        setIsGeneratingPreview(true)
        setCheckoutError(null)

        try {
            const response = await fetch("/api/stickers/preview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: photoDataUrl,
                    childGender,
                    themes: selectedThemes,
                    styleId,
                }),
            })
            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos generar la previsualizacion.")
            }

            if (!payload.imageUrl) {
                throw new Error("No recibimos una imagen de previsualizacion.")
            }

            setGeneratedPreviewUrl(String(payload.imageUrl))
            setGeneratedPreviewToken(typeof payload.previewToken === "string" ? payload.previewToken : null)

            const attempts = Number(payload.attempts)
            if (Number.isFinite(attempts) && attempts > 0) {
                setPreviewAttempts(attempts)
            }

            const quality = (payload.quality ?? null) as StickerPreviewQualityPayload | null
            if (quality && quality.pass === false) {
                const issues = Array.isArray(quality.issues)
                    ? quality.issues.filter((issue) => typeof issue === "string").slice(0, 2)
                    : []
                const qualityLabel = quality.available === false
                    ? "No pudimos validar calidad automaticamente."
                    : "La preview no paso nuestro control de calidad. Proba generar otra."

                const issueText = issues.length > 0 ? ` Detalles detectados: ${issues.join("; ")}.` : ""
                setPreviewQualityWarning(`${qualityLabel}${issueText}`)
            }
        } catch (generationError) {
            setPreviewError(
                generationError instanceof Error
                    ? generationError.message
                    : "No pudimos generar la previsualizacion.",
            )
            setGeneratedPreviewToken(null)
            setPreviewQualityWarning(null)
            setPreviewAttempts(0)
        } finally {
            setIsGeneratingPreview(false)
        }
    }

    const handleCheckout = async (event: FormEvent) => {
        event.preventDefault()

        if (!checkoutEnabled) {
            setCheckoutError(checkoutAvailabilityMessage ?? "El checkout esta en configuracion en este momento.")
            return
        }

        if (!generatedPreviewUrl || !generatedPreviewToken) {
            setCheckoutError("Necesitas una preview aprobada antes de continuar al pago.")
            return
        }

        setCheckoutError(null)
        setIsCheckingOut(true)

        try {
            const payload = {
                customerName,
                customerEmail,
                customerPhone: customerPhone || undefined,
                childGender,
                themes: selectedThemes,
                styleId,
                quantity,
                previewImageUrl: generatedPreviewUrl,
                previewToken: generatedPreviewToken,
                shippingAddress: {
                    recipientName: isRecipientDifferent ? recipientName : customerName,
                    line1,
                    line2: line2 || undefined,
                    city,
                    state: state || undefined,
                    postalCode,
                    countryCode: countryCode.toUpperCase(),
                    phone: customerPhone || undefined,
                },
            }

            const response = await fetch("/api/stickers/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            const checkoutPayload = await response.json()
            if (!response.ok) {
                throw new Error(checkoutPayload.message ?? "No pudimos iniciar el checkout.")
            }

            if (!checkoutPayload.checkout_url) {
                throw new Error("No recibimos URL de checkout.")
            }

            window.location.href = String(checkoutPayload.checkout_url)
        } catch (checkoutSubmissionError) {
            setCheckoutError(
                checkoutSubmissionError instanceof Error
                    ? checkoutSubmissionError.message
                    : "No pudimos iniciar el checkout.",
            )
            setIsCheckingOut(false)
        }
    }

    const handleWaitlistSubmit = async (event: FormEvent) => {
        event.preventDefault()

        setIsSubmittingWaitlist(true)
        setWaitlistError(null)
        setWaitlistSuccess(null)

        try {
            const response = await fetch("/api/stickers/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: waitlistName, email: waitlistEmail }),
            })
            const payload = await response.json()
            if (!response.ok) {
                throw new Error(payload.message ?? "No pudimos registrarte en la lista.")
            }

            captureEvent("stickers_waitlist_joined", { source: "stickers_page" })
            setWaitlistSuccess("Listo. Te avisamos de nuevos packs y promos.")
            setWaitlistName("")
            setWaitlistEmail("")
        } catch (waitlistSubmissionError) {
            setWaitlistError(
                waitlistSubmissionError instanceof Error
                    ? waitlistSubmissionError.message
                    : "No pudimos registrarte en la lista.",
            )
        } finally {
            setIsSubmittingWaitlist(false)
        }
    }

    /* ── Drag-and-drop helpers ── */
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (!file) return
        // Reuse the same handler via a synthetic-ish approach
        const dt = new DataTransfer()
        dt.items.add(file)
        const syntheticEvent = { target: { files: dt.files } } as unknown as ChangeEvent<HTMLInputElement>
        void handlePhotoChange(syntheticEvent)
    }

    /* ── Shared input class ── */
    const inputCls = "w-full rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/20 bg-white/90 px-4 py-3 text-sm text-[var(--play-text-main)] placeholder:text-[var(--play-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--play-accent-gift)]/40"

    return (
        <main className="min-h-screen bg-[var(--play-surface)] pt-24 pb-12 relative overflow-hidden">
            {/* ── Background Floating Stickers ── */}
            <motion.div 
                className="absolute top-10 left-[2%] md:left-[12%] z-0 pointer-events-none select-none text-[90px] md:text-[130px]"
                style={{ filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 8px 16px rgba(0,0,0,0.15))" }}
                animate={{ y: [0, -20, 0], rotate: [-5, 8, -5] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                🍌
            </motion.div>
            <motion.div 
                className="absolute top-40 right-[2%] md:right-[12%] z-0 pointer-events-none select-none text-[70px] md:text-[100px]"
                style={{ filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 8px 16px rgba(0,0,0,0.15))" }}
                animate={{ y: [0, 15, 0], rotate: [5, -12, 5] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
                ⭐
            </motion.div>
            <motion.div 
                className="absolute top-[45%] left-[1%] md:left-[8%] z-0 pointer-events-none select-none text-[60px] md:text-[90px]"
                style={{ filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 8px 16px rgba(0,0,0,0.15))" }}
                animate={{ y: [0, -15, 0], rotate: [-10, 10, -10] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            >
                💖
            </motion.div>
            <motion.div 
                className="absolute top-[65%] right-[2%] md:right-[10%] z-0 pointer-events-none select-none text-[50px] md:text-[80px]"
                style={{ filter: "drop-shadow(0px 0px 6px rgba(255,255,255,0.8)) drop-shadow(0px 5px 10px rgba(0,0,0,0.1))" }}
                animate={{ y: [0, 20, 0], rotate: [0, 20, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                ✨
            </motion.div>
            <motion.div 
                className="absolute bottom-[5%] left-[8%] md:left-[20%] z-0 pointer-events-none select-none text-[80px] md:text-[110px]"
                style={{ filter: "drop-shadow(0px 0px 8px rgba(255,255,255,0.9)) drop-shadow(0px 8px 16px rgba(0,0,0,0.15))" }}
                animate={{ y: [0, 10, 0], rotate: [-8, 8, -8] }}
                transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            >
                🌸
            </motion.div>

            <section className="mx-auto max-w-2xl px-5 space-y-8 relative z-10">
                {/* ── Hero ── */}
                <motion.div
                    className="text-center pt-4"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="play-title text-4xl md:text-5xl mb-2 font-black bg-gradient-to-r from-[var(--play-accent-gift)] via-purple-500 to-pink-500 bg-clip-text text-transparent drop-shadow-sm">
                        Stickers Mágicos ✨
                    </h1>
                    <p className="play-copy text-[var(--play-text-muted)] max-w-md mx-auto font-medium">
                        Subí una foto, elegí el estilo y dejá que la magia cree tu plancha de stickers súper cute con IA.
                    </p>
                </motion.div>

                {/* ── Step indicator ── */}
                <div className="flex items-center justify-center gap-2">
                    {STEPS.map((s, i) => {
                        const done = currentStep >= s.num
                        return (
                            <div key={s.num} className="flex items-center gap-2">
                                {i > 0 && (
                                    <div className={`w-8 h-0.5 rounded-full transition-colors ${done ? "bg-[var(--play-accent-gift)]" : "bg-[var(--play-outline)]/25"}`} />
                                )}
                                <div className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${done ? "bg-[var(--play-accent-gift)]/15 text-[var(--play-accent-gift)]" : "bg-white/60 text-[var(--play-text-muted)]"}`}>
                                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="w-3.5 text-center">{s.num}</span>}
                                    <span>{s.label}</span>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* ── Checkout availability warning ── */}
                {checkoutAvailabilityMessage && (
                    <div className="rounded-[var(--play-radius-panel)] border border-amber-200/50 bg-amber-50/80 backdrop-blur-sm px-5 py-4 text-amber-900 text-sm">
                        <p className="font-bold text-xs uppercase tracking-wide text-amber-700 mb-1">Pagos en configuracion</p>
                        <p className="leading-relaxed">{checkoutAvailabilityMessage}</p>
                    </div>
                )}

                {/* ── 1. Photo upload ── */}
                <div className="bg-white/80 backdrop-blur-sm border border-[var(--play-outline)]/15 rounded-[var(--play-radius-panel)] p-6 space-y-4 shadow-sm relative z-10">
                    <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--play-accent-gift)]">Paso 1 📸</p>
                    <h2 className="text-lg font-bold text-[var(--play-text-main)]">Subí tu foto</h2>

                    {photoPreviewUrl ? (
                        <div className="space-y-3">
                            <div className="relative rounded-2xl overflow-hidden aspect-square max-w-xs mx-auto border border-[var(--play-outline)]/15">
                                <img src={photoPreviewUrl} alt="Foto subida" className="w-full h-full object-cover" />
                            </div>
                            <label className="gummy-button play-primary-button w-full flex items-center justify-center gap-2 cursor-pointer text-sm">
                                <Upload className="h-4 w-4" />
                                Cambiar foto
                                <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
                            </label>
                        </div>
                    ) : (
                        <motion.div
                            className={`relative border-2 border-dashed rounded-[var(--play-radius-panel)] p-10 text-center transition-all cursor-pointer group overflow-hidden ${isDragging
                                ? "border-[var(--play-accent-gift)] bg-[var(--play-accent-gift)]/10 scale-[1.02] shadow-lg shadow-[var(--play-accent-gift)]/20"
                                : "border-[var(--play-outline)]/40 hover:border-[var(--play-accent-gift)]/60 hover:bg-white/90"
                                }`}
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <input type="file" accept="image/*" onChange={handlePhotoChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                            <motion.div
                                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--play-accent-gift)] to-pink-500 flex items-center justify-center shadow-inner"
                                animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
                                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                            >
                                <Sparkles className="w-8 h-8 text-white drop-shadow-md" />
                            </motion.div>
                            <p className="text-[var(--play-text-main)] font-bold mb-1 text-lg">Arrastrá una foto o tocá acá 📸</p>
                            <p className="text-sm text-[var(--play-text-muted)] font-medium">Solo JPG o PNG (hasta 5MB)</p>
                        </motion.div>
                    )}

                    {previewError && (
                        <div className="rounded-xl border border-red-200/50 bg-red-50/80 px-4 py-3 text-red-700 text-sm font-medium">
                            {previewError}
                        </div>
                    )}
                </div>

                {/* ── 2. Gender + Style + Themes ── */}
                <div className="bg-white/80 backdrop-blur-sm border border-[var(--play-outline)]/15 rounded-[var(--play-radius-panel)] p-6 space-y-5 shadow-sm relative z-10">
                    <div>
                        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--play-accent-gift)]">Paso 2 🎨</p>
                        <h2 className="text-lg font-bold text-[var(--play-text-main)] mt-1">Estilo y temáticas</h2>
                    </div>

                    {/* Gender + Style in one row */}
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-white/40 rounded-[calc(var(--play-radius-panel)+0.5rem)] border border-[var(--play-outline)]/10 backdrop-blur-md">
                        {(["niña", "niño"] as StickerGender[]).map((gender) => (
                            <button
                                key={gender}
                                type="button"
                                onClick={() => setChildGender(gender)}
                                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${childGender === gender
                                    ? "bg-gradient-to-br from-[var(--play-accent-gift)] to-purple-500 text-white shadow-lg shadow-purple-500/20 border border-transparent"
                                    : "bg-white/60 border border-[var(--play-outline)]/15 text-[var(--play-text-muted)] hover:border-purple-300 hover:bg-white"
                                    }`}
                            >
                                {gender === "niña" ? "👧 Niña" : "👦 Niño"}
                            </button>
                        ))}
                        <div className="w-px h-8 bg-[var(--play-outline)]/10 mx-2 hidden sm:block" />
                        {(Object.entries(STICKER_STYLE_PRESETS) as Array<
                            [StickerStyleId, (typeof STICKER_STYLE_PRESETS)[StickerStyleId]]
                        >).map(([id, style]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => handleStyleChange(id)}
                                className={`rounded-full px-5 py-2.5 text-sm font-bold transition-all duration-300 ${styleId === id
                                    ? "bg-gradient-to-br from-pink-500 to-rose-400 text-white shadow-lg shadow-pink-500/20 border border-transparent"
                                    : "bg-white/60 border border-[var(--play-outline)]/15 text-[var(--play-text-muted)] hover:border-pink-300 hover:bg-white"
                                    }`}
                            >
                                {style.label.includes('Acuarela') ? '🎨 ' : (style.label.includes('Cartoon') ? '📺 ' : '✨ ')}
                                {style.label}
                            </button>
                        ))}
                    </div>

                    {/* Theme packs (primary) */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-sm font-bold text-[var(--play-text-main)] flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4 text-[var(--play-accent-gift)]" />
                                Packs rápidos
                            </p>
                            <button type="button" onClick={() => setSelectedThemes([])} className="text-xs font-semibold text-[var(--play-text-muted)] hover:text-pink-500 transition-colors bg-white/50 px-3 py-1.5 rounded-full border border-[var(--play-outline)]/10 hover:border-pink-200 shadow-sm">
                                Limpiar selección
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {activeThemePacks.map((pack) => {
                                const isActive = pack.themes.length === selectedThemes.length && pack.themes.every((t) => selectedThemes.includes(t))
                                return (
                                    <button
                                        key={pack.id}
                                        type="button"
                                        onClick={() => applyThemePack(pack.themes)}
                                        className={`relative rounded-[var(--play-radius-panel)] border p-4 lg:p-5 text-left transition-all duration-300 overflow-hidden group ${isActive
                                            ? "border-transparent bg-gradient-to-br from-pink-50 via-purple-50 to-white shadow-md ring-2 ring-[var(--play-accent-gift)]/30"
                                            : "border-[var(--play-outline)]/15 bg-white/70 hover:border-purple-300 hover:bg-white hover:shadow-sm"
                                            }`}
                                    >
                                        {isActive && (
                                            <div className="absolute top-0 right-0 p-3 opacity-20 transform -translate-y-1 translate-x-1">
                                                <Sparkles className="w-10 h-10 text-purple-500" />
                                            </div>
                                        )}
                                        <p className={`text-base font-black relative z-10 ${isActive ? "text-purple-700" : "text-[var(--play-text-main)] group-hover:text-purple-600"}`}>
                                            {pack.label}
                                        </p>
                                        <p className="mt-1.5 text-xs font-medium text-[var(--play-text-muted)] relative z-10">
                                            {pack.themes.join(" • ")}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Individual themes (secondary) */}
                    <div className="pt-2">
                        <p className="text-sm font-bold text-[var(--play-text-main)] mb-3">O armá el tuyo 🧩</p>
                        <div className="flex flex-wrap gap-2">
                            {availableThemes.map((theme) => {
                                const isSelected = selectedThemes.includes(theme)
                                return (
                                    <button
                                        key={theme}
                                        type="button"
                                        onClick={() => toggleTheme(theme)}
                                        className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 transform ${isSelected
                                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md shadow-purple-500/25 scale-105 border-transparent"
                                            : "bg-white/80 border border-[var(--play-outline)]/15 text-[var(--play-text-muted)] hover:border-pink-300 hover:text-pink-600 hover:bg-white"
                                            }`}
                                    >
                                        {theme}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="mt-4 inline-flex items-center gap-1.5 bg-white/60 px-3 py-1.5 rounded-full border border-[var(--play-outline)]/5">
                            <span className="text-[var(--play-accent-gift)] text-sm">💡</span>
                            <span className="text-xs font-medium text-[var(--play-text-muted)]">Elegí entre 1 y 6 temáticas.</span>
                        </div>
                    </div>

                    {selectedThemes.length > 0 && (
                        <p className="text-xs text-[var(--play-text-muted)]">
                            Seleccion: <span className="font-semibold text-[var(--play-text-main)]">{selectedThemesLabel}</span>
                            {" \u00b7 "}Estilo: <span className="font-semibold text-[var(--play-text-main)]">{selectedStyle.label}</span>
                        </p>
                    )}
                </div>

                {/* ── Generate button ── */}
                <motion.button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={isGeneratingPreview || !photoDataUrl || selectedThemes.length === 0}
                    className="gummy-button play-primary-button w-full py-4 text-lg font-black flex items-center justify-center gap-2 disabled:opacity-50 shadow-xl shadow-[var(--play-accent-gift)]/20"
                    whileTap={{ scale: 0.97 }}
                >
                    {isGeneratingPreview ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            Generando magia...
                        </>
                    ) : (
                        <>
                            <Sparkles className="h-6 w-6 text-white drop-shadow-md" />
                            Generar magia ✨
                        </>
                    )}
                </motion.button>

                {/* ── Status messages ── */}
                <AnimatePresence>
                    {previewQualityWarning && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[var(--play-radius-panel)] border border-amber-200/50 bg-amber-50/80 px-4 py-3 text-amber-800 text-sm font-medium">
                            {previewQualityWarning}
                        </motion.div>
                    )}
                    {previewAttempts > 1 && !previewQualityWarning && !previewError && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[var(--play-radius-panel)] border border-emerald-200/50 bg-emerald-50/80 px-4 py-3 text-emerald-800 text-sm font-medium">
                            Ajustamos la generacion para mejorar la cara.
                        </motion.div>
                    )}
                    {hasPreview && !previewQualityWarning && !previewError && (
                        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-[var(--play-radius-panel)] border border-emerald-200/50 bg-emerald-50/80 px-4 py-3 text-emerald-800 text-sm font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Preview aprobada para compra.
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── 3. Preview ── */}
                {(generatedPreviewUrl || isGeneratingPreview) && (
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm border border-[var(--play-outline)]/15 rounded-[var(--play-radius-panel)] p-6 space-y-3"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-[var(--play-text-main)]">Tu preview</h2>
                            {hasPreview && (
                                <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
                                    Lista
                                </span>
                            )}
                        </div>

                        <div className="relative rounded-2xl overflow-hidden bg-[var(--play-outline)]/5 min-h-[280px]">
                            {generatedPreviewUrl ? (
                                <>
                                    <img
                                        src={generatedPreviewUrl}
                                        alt="Preview de stickers"
                                        className="w-full h-auto"
                                        draggable={false}
                                        onContextMenu={(event) => event.preventDefault()}
                                    />
                                    {/* Watermark overlay */}
                                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <span className="text-black/10 text-4xl md:text-6xl font-black uppercase rotate-[-18deg] select-none tracking-widest">
                                            PREVIEW
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div className="h-[280px] flex items-center justify-center">
                                    <div className="w-10 h-10 border-3 border-[var(--play-accent-gift)]/30 border-t-[var(--play-accent-gift)] rounded-full animate-spin" />
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-[var(--play-text-muted)]">
                            La marca de agua no aparece en la version final impresa.
                        </p>
                        {previewAttempts > 0 && (
                            <p className="text-xs text-[var(--play-text-muted)]">
                                Intentos: <span className="font-semibold">{previewAttempts}</span>
                            </p>
                        )}
                    </motion.div>
                )}

                {/* ── Checkout (only after preview) ── */}
                {hasPreview && (
                    <motion.div
                        className="bg-white/80 backdrop-blur-sm border border-[var(--play-outline)]/15 rounded-[var(--play-radius-panel)] overflow-hidden"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Collapsible header */}
                        <button
                            type="button"
                            onClick={() => setCheckoutOpen(!checkoutOpen)}
                            className="w-full flex items-center justify-between px-6 py-4 text-left"
                        >
                            <div>
                                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[var(--play-accent-gift)]">Último paso 🚀</p>
                                <h2 className="text-lg font-bold text-[var(--play-text-main)]">Datos y envío</h2>
                            </div>
                            <motion.div animate={{ rotate: checkoutOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                <ChevronDown className="h-5 w-5 text-[var(--play-text-muted)]" />
                            </motion.div>
                        </button>

                        <AnimatePresence initial={false}>
                            {checkoutOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <form onSubmit={handleCheckout} className="px-6 pb-6 space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="stickers-name" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Nombre</label>
                                                <input id="stickers-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label htmlFor="stickers-email" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Email</label>
                                                <input id="stickers-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputCls} required />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
                                            <div>
                                                <label htmlFor="stickers-phone" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Telefono (opcional)</label>
                                                <input id="stickers-phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className={inputCls} />
                                            </div>
                                            <div>
                                                <span className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Cantidad</span>
                                                <div className="flex items-center rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/20 bg-white">
                                                    <button type="button" onClick={() => changeQuantity(quantity - 1)} className="flex h-11 w-11 items-center justify-center text-[var(--play-text-muted)] hover:text-[var(--play-accent-gift)] transition-colors" aria-label="Restar cantidad">
                                                        <Minus className="h-4 w-4" />
                                                    </button>
                                                    <div className="min-w-14 px-2 text-center text-base font-bold text-[var(--play-text-main)]">{quantity}</div>
                                                    <button type="button" onClick={() => changeQuantity(quantity + 1)} className="flex h-11 w-11 items-center justify-center text-[var(--play-text-muted)] hover:text-[var(--play-accent-gift)] transition-colors" aria-label="Sumar cantidad">
                                                        <Plus className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <label className="flex items-start gap-3 rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/10 bg-[var(--play-surface)] px-4 py-3 text-sm text-[var(--play-text-main)] cursor-pointer">
                                            <input type="checkbox" checked={isRecipientDifferent} onChange={(e) => setIsRecipientDifferent(e.target.checked)} className="mt-1 accent-[var(--play-accent-gift)]" />
                                            <span>
                                                Lo recibe otra persona
                                                <span className="block text-xs text-[var(--play-text-muted)] mt-0.5">Si no, usamos tu nombre para la entrega.</span>
                                            </span>
                                        </label>

                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {isRecipientDifferent && (
                                                <div className="sm:col-span-2">
                                                    <label htmlFor="stickers-recipient" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Nombre destinatario</label>
                                                    <input id="stickers-recipient" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} className={inputCls} required={isRecipientDifferent} />
                                                </div>
                                            )}
                                            <div>
                                                <label htmlFor="stickers-line1" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Direccion</label>
                                                <input id="stickers-line1" value={line1} onChange={(e) => setLine1(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label htmlFor="stickers-line2" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Piso / Dpto (opcional)</label>
                                                <input id="stickers-line2" value={line2} onChange={(e) => setLine2(e.target.value)} className={inputCls} />
                                            </div>
                                            <div>
                                                <label htmlFor="stickers-city" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Ciudad</label>
                                                <input id="stickers-city" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label htmlFor="stickers-state" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Provincia</label>
                                                <input id="stickers-state" value={state} onChange={(e) => setState(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label htmlFor="stickers-postal" className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Codigo postal</label>
                                                <input id="stickers-postal" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputCls} required />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-[var(--play-text-main)] mb-1.5">Pais</label>
                                                <div className={`${inputCls} flex items-center`}>Argentina</div>
                                            </div>
                                        </div>

                                        {/* Subtotal */}
                                        <div className="rounded-[var(--play-radius-panel)] border border-[var(--play-accent-gift)]/15 bg-[var(--play-accent-gift)]/5 px-4 py-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[var(--play-text-main)]">Subtotal ({quantity} plancha{quantity > 1 ? "s" : ""})</span>
                                                <strong className="text-[var(--play-accent-gift)]">{formatArs(subtotalEstimate)}</strong>
                                            </div>
                                            <p className="text-xs text-[var(--play-text-muted)] mt-1">El envio se calcula en el checkout.</p>
                                        </div>

                                        {checkoutError && (
                                            <div className="rounded-xl border border-red-200/50 bg-red-50/80 px-4 py-3 text-red-700 text-sm font-medium">{checkoutError}</div>
                                        )}

                                        {checkoutAvailabilityMessage && (
                                            <div className="rounded-xl border border-amber-200/50 bg-amber-50/80 px-4 py-3 text-amber-900 text-sm font-medium">
                                                Podes dejar la preview y la direccion listas, pero el cobro queda pausado hasta activar Mercado Pago.
                                            </div>
                                        )}

                                        <motion.button
                                            type="submit"
                                            disabled={isCheckingOut || !checkoutEnabled}
                                            className="gummy-button play-primary-button w-full py-4 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            {isCheckingOut ? "Redirigiendo a pago..." : checkoutEnabled ? "Ir a pagar" : "Pagos en configuracion"}
                                            {!isCheckingOut && <ChevronRight className="h-4 w-4" />}
                                        </motion.button>
                                    </form>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </section>
            <Footer />
        </main>
    )
}
