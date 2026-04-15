"use client"

import Link from "next/link"
import React, { useEffect, useMemo, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import { AlertCircle, CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { AlchemistLoading } from "@/components/story-wizard/AlchemistLoading"
import { FlipbookPreview } from "@/components/story-wizard/FlipbookPreview"
import { PrintConfigurator, PrintConfig } from "@/components/features/print/PrintConfigurator"
import { STORIES } from "@/lib/stories"
import { findStoryMockByIdOrSlug, siteContent } from "@/lib/site-content"
import { ReadingLevel } from "@/components/features/education/ReadingLevelSelector"
import { useRouter } from "next/navigation"
import { captureEvent } from "@/lib/analytics/events"
import { getValentinDinoSceneAssetUrl, getValentinDinoPersonalizedTitle } from "@/lib/books/valentin-dino-package"

const APPROVED_STYLE = {
    id: "cinematic-3d",
    name: "Animación 3D cálida",
    image: "/stories/valentin-noche-dinosaurios/cover.png",
}

interface PreviewStepProps {
    data: {
        image: File | null
        childName: string
        childAge: number
        childGender?: string
        selectedStory: string | null
        selectedStyle: string | null
        familyMembers?: Array<{
            id: string
            role: string
            name: string
            photo: string | null
        }>
        giftData?: {
            type: "digital" | "physical" | null
            message: string
            senderName: string
            recipientName: string
            scheduledDate: string
            scheduledTime: string
        }
        isGift: boolean
        readingLevel: ReadingLevel
        childFeatures?: Record<string, unknown> | null
    }
    printConfig: PrintConfig
    onPrintConfigChange: (config: PrintConfig) => void
    isGenerating: boolean
    generatedPreview: {
        previewSessionId: string
        status?: "queued" | "processing" | "completed" | "failed"
        progress?: {
            completedPages: number
            totalPages: number
        }
        imageUrl: string | null
        sceneText: string | null
        imageProvider?: "gemini" | "fallback" | null
        imageModel?: string | null
        generationMode?: string | null
        pages: Array<{
            sceneId: string
            pageNumber: number
            title: string
            text: string
            imageUrl: string
            storage: {
                bucket: string
                path: string
            }
        }>
        previewBundle: Record<string, unknown>
    } | null
    previewError: string | null
    onRetryPreview?: () => void
}

interface ShippingAddressForm {
    recipientName: string
    line1: string
    line2: string
    city: string
    state: string
    postalCode: string
    countryCode: string
    phone: string
}

interface QuotePreview {
    subtotal: number
    shipping: number
    total: number
    currency: "USD" | "ARS"
    shippingEtaDays: number | null
}

interface CheckoutAvailabilityPayload {
    provider: "mercadopago" | "stripe"
    enabled: boolean
    message: string | null
}

function formatCurrency(value: number, currency: "USD" | "ARS") {
    if (currency === "USD") return `USD ${value.toFixed(2)}`
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0,
    }).format(value)
}

function isAddressReady(address: ShippingAddressForm) {
    return (
        address.recipientName.trim().length >= 2 &&
        address.line1.trim().length >= 4 &&
        address.city.trim().length >= 2 &&
        address.state.trim().length >= 2 &&
        address.postalCode.trim().length >= 3
    )
}

export function PreviewStep({
    data,
    printConfig,
    onPrintConfigChange,
    isGenerating,
    generatedPreview,
    previewError,
    onRetryPreview,
}: PreviewStepProps) {
    const prefersReducedMotion = useReducedMotion()
    const motionProps = prefersReducedMotion ? { initial: false } : {}
    const story = STORIES.find((s) => s.id === data.selectedStory)
    const storyMock = findStoryMockByIdOrSlug(data.selectedStory)
    const style = APPROVED_STYLE
    const previewUrl = generatedPreview?.imageUrl ?? null
    const familyCount = data.familyMembers?.length || 0
    const [format, setFormat] = useState<"digital" | "print">("print")
    const [currency, setCurrency] = useState<"USD" | "ARS">("ARS")
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
    const [checkoutAvailability, setCheckoutAvailability] = useState<CheckoutAvailabilityPayload | null>(null)
    const [quotePreview, setQuotePreview] = useState<QuotePreview | null>(null)
    const [shippingAddress, setShippingAddress] = useState<ShippingAddressForm>({
        recipientName: data.childName || "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        countryCode: "AR",
        phone: "",
    })
    const router = useRouter()

    const PREVIEW_FX = 1200

    const fallbackSubtotal = useMemo(() => {
        if (!story) return 0
        const subtotalArs = format === "print" ? story.printPriceArs : story.digitalPriceArs
        if (currency === "ARS") return subtotalArs
        return Number((subtotalArs / PREVIEW_FX).toFixed(2))
    }, [story, format, currency])

    const fallbackShipping = useMemo(() => {
        if (format !== "print") return 0
        if (currency === "ARS") return 6500
        return Number((6500 / PREVIEW_FX).toFixed(2))
    }, [format, currency])

    const subtotal = quotePreview?.currency === currency ? quotePreview.subtotal : fallbackSubtotal
    const shipping = quotePreview?.currency === currency ? quotePreview.shipping : fallbackShipping
    const total = quotePreview?.currency === currency ? quotePreview.total : subtotal + shipping

    const readingLevelLabel = data.readingLevel === "basic"
        ? "Básico"
        : data.readingLevel === "intermediate"
            ? "Intermedio"
            : "Avanzado"
    const checkoutEnabled = checkoutAvailability?.enabled !== false
    const checkoutAvailabilityMessage = checkoutAvailability?.enabled === false
        ? checkoutAvailability.message
        : null
    const deliveryCopy = format === "print"
        ? `Digital inmediato + impreso ${quotePreview?.shippingEtaDays ? `${quotePreview.shippingEtaDays} días` : "5-10 días"}`
        : "Entrega digital inmediata"
    const checkoutLabel = !checkoutEnabled
        ? "Pagos en configuración"
        : format === "print"
            ? siteContent.preview.checkoutCtaPrint
            : siteContent.preview.checkoutCtaDigital
    const checkoutCtaAmount = formatCurrency(total, currency)
    const formatDetailLabel = format === "print" && story
        ? `${story.printSpecs.format} · ${story.printSpecs.size}`
        : "Versión digital"
    const shippingValueLabel = format === "digital"
        ? "Incluido"
        : quotePreview?.currency === currency
            ? formatCurrency(shipping, currency)
            : "Cotizar envío"
    const previewInProgress =
        isGenerating || generatedPreview?.status === "queued" || generatedPreview?.status === "processing"
    const previewUsesFallback =
        generatedPreview?.imageProvider === "fallback" &&
        Boolean(generatedPreview?.pages?.length)
    const previewProgressLabel =
        generatedPreview?.progress && generatedPreview.progress.totalPages > 0
            ? `${generatedPreview.progress.completedPages}/${generatedPreview.progress.totalPages} escenas listas`
            : null

    const flipbookPages = useMemo(() => {
        if (!generatedPreview?.pages?.length) return []

        return generatedPreview.pages
            .slice()
            .sort((left, right) => left.pageNumber - right.pageNumber)
            .map((page) => ({
                id: page.sceneId,
                pageNumber: page.pageNumber,
                imageUrl:
                    generatedPreview.imageProvider === "fallback"
                        ? getValentinDinoSceneAssetUrl(page.sceneId as Parameters<typeof getValentinDinoSceneAssetUrl>[0]) ?? page.imageUrl
                        : page.imageUrl,
                text: generatedPreview.pages.length === 1 ? "" : page.text,
                title: page.title,
                childName: data.childName,
            }))
    }, [generatedPreview, data.childName])

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
                // Avoid blocking checkout because of a transient client-side probe failure.
            }
        }

        void loadCheckoutAvailability()

        return () => {
            cancelled = true
        }
    }, [])

    const handleCheckout = async () => {
        if (!story || !data.childName || isCheckingOut) return
        if (!checkoutEnabled) {
            setCheckoutError(checkoutAvailabilityMessage ?? "El checkout está en configuración en este momento.")
            return
        }
        if (
            !generatedPreview ||
            generatedPreview.status !== "completed" ||
            !generatedPreview.previewSessionId ||
            generatedPreview.pages.length === 0
        ) {
            setCheckoutError("Genera la vista previa personalizada antes de continuar.")
            return
        }
        if (format === "print" && !isAddressReady(shippingAddress)) {
            setCheckoutError("Completa la dirección de envío para continuar.")
            return
        }

        setIsCheckingOut(true)
        setCheckoutError(null)

        captureEvent("checkout_started", {
            format,
            currency,
            total_estimate: Number(total.toFixed(2)),
        })

        try {
            const childProfile = {
                name: data.childName,
                age: data.childAge,
                child_gender: data.childGender || "neutral",
                detected_features: data.childFeatures ?? {},
            }

            const personalizationPayload = {
                selected_style: data.selectedStyle,
                selected_story: story.id,
                reading_level: data.readingLevel,
                family_members: data.familyMembers ?? [],
                gift_data: data.giftData ?? null,
                preview_image_url: generatedPreview?.imageUrl ?? null,
                preview_session_id: generatedPreview.previewSessionId,
                preview_bundle: generatedPreview.previewBundle,
            }

            const shippingPayload = format === "print"
                ? {
                    recipientName: shippingAddress.recipientName,
                    line1: shippingAddress.line1,
                    line2: shippingAddress.line2 || undefined,
                    city: shippingAddress.city,
                    state: shippingAddress.state,
                    postalCode: shippingAddress.postalCode,
                    countryCode: shippingAddress.countryCode,
                    phone: shippingAddress.phone || undefined,
                }
                : undefined

            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    story_id: story.id,
                    child_profile: childProfile,
                    personalization_payload: personalizationPayload,
                    format,
                    print_options: format === "print" ? printConfig : {},
                    currency,
                    payment_provider: "mercadopago",
                    shipping_address: shippingPayload,
                }),
            })

            if (orderResponse.status === 401) {
                captureEvent("auth_redirect_required", { from: "checkout" })
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const orderPayload = await orderResponse.json()
            if (!orderResponse.ok || !orderPayload.order_id) {
                throw new Error(orderPayload.message ?? "No se pudo crear la orden.")
            }

            const quoteResponse = await fetch("/api/orders/quote", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    order_id: orderPayload.order_id,
                    story_id: story.id,
                    format,
                    print_options: format === "print" ? printConfig : {},
                    shipping_address: shippingPayload,
                    currency,
                }),
            })

            const quotePayload = await quoteResponse.json()
            if (!quoteResponse.ok || !quotePayload.quote_id) {
                throw new Error(quotePayload.message ?? "No se pudo calcular la cotización.")
            }

            setQuotePreview({
                subtotal: Number(quotePayload.subtotal),
                shipping: Number(quotePayload.shipping_fee),
                total: Number(quotePayload.total),
                currency: quotePayload.currency === "USD" ? "USD" : "ARS",
                shippingEtaDays:
                    quotePayload.shipping_eta_days === null ? null : Number(quotePayload.shipping_eta_days),
            })

            captureEvent("shipping_quote_generated", {
                format,
                has_shipping: Number(quotePayload.shipping_fee) > 0,
                shipping_fee: Number(quotePayload.shipping_fee),
            })

            const checkoutResponse = await fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    quote_id: quotePayload.quote_id,
                }),
            })

            if (checkoutResponse.status === 401) {
                captureEvent("auth_redirect_required", { from: "checkout" })
                const nextPath = `${window.location.pathname}${window.location.search}`
                router.push(`/login?next=${encodeURIComponent(nextPath)}`)
                return
            }

            const checkoutPayload = await checkoutResponse.json()
            if (!checkoutResponse.ok || !checkoutPayload.checkout_url) {
                throw new Error(checkoutPayload.message ?? "No se pudo iniciar el checkout.")
            }

            const provider = checkoutPayload.provider === "stripe" ? "stripe" : "mercadopago"
            captureEvent("checkout_redirected", { provider })
            window.location.href = checkoutPayload.checkout_url
        } catch (error) {
            const message = error instanceof Error ? error.message : "No se pudo iniciar el checkout."
            captureEvent("checkout_error", { message })
            setCheckoutError(message)
        } finally {
            setIsCheckingOut(false)
        }
    }

    return (
        <div className="mx-auto max-w-[1380px] space-y-5">
            <motion.div className="text-center" initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.22em] text-[var(--play-primary)]">{siteContent.preview.eyebrow}</p>
                <h2 className="play-title text-3xl md:text-4xl">
                    {siteContent.preview.title}
                </h2>
                <p className="play-copy mx-auto mt-2 max-w-2xl">
                    {siteContent.preview.copy}
                </p>
            </motion.div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_340px] xl:items-start">
                <div className="space-y-6">
                    <motion.div
                        initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="play-panel overflow-hidden p-4 md:p-5"
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
                            <p className="text-sm font-semibold text-[var(--play-text-main)]">{siteContent.preview.previewTitle}</p>
                            <div className="play-pill px-3 py-1.5 text-[11px]">
                                {story?.title || "Tu cuento"}
                            </div>
                        </div>
                        {previewUsesFallback && (
                            <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                                    <div className="space-y-1">
                                        <p className="font-bold">Vista temporal de contingencia</p>
                                        <p>
                                            Gemini no está devolviendo imágenes ahora mismo. Esta muestra usa el arte base del cuento con una referencia de personaje,
                                            pero no representa la personalización final.
                                        </p>
                                        {generatedPreview?.imageModel ? (
                                            <p className="text-xs font-medium text-amber-800/80">
                                                Motor reportado: {generatedPreview.imageModel}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        )}
                        {previewInProgress ? (
                            <AlchemistLoading />
                        ) : flipbookPages.length > 0 ? (
                            <FlipbookPreview
                                title={data.childName ? getValentinDinoPersonalizedTitle(data.childName) : (story?.title || "Tu Cuento")}
                                pages={flipbookPages}
                                layout="full-image"
                                showWatermark
                            />
                        ) : generatedPreview?.status === "failed" ? (
                            <div role="alert" className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-10 text-center">
                                <AlertCircle className="mb-4 h-10 w-10 text-amber-700" />
                                <h3 className="text-xl font-black text-amber-900">La preview falló</h3>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-amber-900/80">
                                    {previewError ?? "No pudimos completar la preview con esta foto. Probá de nuevo o subí otra imagen más clara."}
                                </p>
                                {onRetryPreview && (
                                    <button
                                        onClick={onRetryPreview}
                                        className="gummy-button play-primary-button mt-6 px-6 py-3"
                                    >
                                        Intentar de nuevo
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[var(--play-outline)] bg-[var(--play-surface-low)] px-6 py-10 text-center">
                                <Sparkles className="mb-4 h-10 w-10 text-[var(--play-primary)]" />
                                <h3 className="text-xl font-black text-[var(--play-text-main)]">La preview todavía no está lista</h3>
                                <p className="mt-2 max-w-lg text-sm leading-6 text-[var(--play-text-muted)]">
                                    Cuando la generación termina, aquí vas a ver la portada y las escenas reales personalizadas del cuento.
                                </p>
                            </div>
                        )}
                        {previewError && (
                            <div role="alert" className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{previewError}</p>
                                </div>
                            </div>
                        )}
                        {previewInProgress && (
                            <div aria-live="polite" className="mt-4 rounded-2xl border border-[var(--nido-line)] bg-white/75 px-4 py-3 text-sm leading-6 text-[var(--play-text-muted)]">
                                {previewProgressLabel
                                    ? `Estamos generando la preview real. ${previewProgressLabel}.`
                                    : "Estamos generando la preview real escena por escena. Esto puede tardar unos minutos."}
                            </div>
                        )}
                        <p className="mt-4 rounded-2xl border border-[var(--nido-line)] bg-white/75 px-4 py-3 text-sm leading-6 text-[var(--play-text-muted)]">
                            {storyMock?.previewPromise ?? siteContent.preview.sampleNote}
                        </p>
                    </motion.div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/70 p-4 backdrop-blur-sm">
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Protagonista</p>
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm ring-2 ring-white">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[var(--play-surface-low)] text-[var(--play-primary)]">
                                        <Sparkles className="h-6 w-6" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <h3 className="truncate text-sm font-bold text-[var(--play-text-main)]">{data.childName || "Pendiente"}</h3>
                                    <p className="text-xs text-[var(--play-text-muted)]">{data.childAge} años · {readingLevelLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/70 p-4 backdrop-blur-sm">
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Historia</p>
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm ring-2 ring-white">
                                    <img src={story?.coverImage} alt={story?.title} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="truncate text-sm font-bold text-[var(--play-text-main)]">{story?.title}</h4>
                                    <p className="text-xs text-[var(--play-text-muted)]">{story?.ages}</p>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/70 p-4 backdrop-blur-sm">
                            <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Formato</p>
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl shadow-sm ring-2 ring-white">
                                    <img src={style?.image} alt={style?.name} className="h-full w-full object-cover" />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="truncate text-sm font-bold text-[var(--play-text-main)]">{style?.name || "Personalizado"}</h4>
                                    <p className="text-xs text-[var(--play-text-muted)]">21×21 cm · Tapa {format === "print" ? "impresa" : "digital"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {format === "print" ? (
                            <>
                                <PrintConfigurator
                                    config={printConfig}
                                    onChange={onPrintConfigChange}
                                    basePrice={story?.printPriceArs ?? 29990}
                                />

                                <div className="play-panel p-5">
                                    <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Datos de envío</h4>
                                    <div className="grid gap-3 lg:grid-cols-3">
                                        <input
                                            value={shippingAddress.recipientName}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, recipientName: event.target.value }))}
                                            placeholder="Nombre y apellido"
                                            aria-label="Nombre y apellido del destinatario"
                                            className="form-field lg:col-span-2"
                                        />
                                        <input
                                            value={shippingAddress.phone}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))}
                                            placeholder="Teléfono (opcional)"
                                            aria-label="Teléfono"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.line1}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line1: event.target.value }))}
                                            placeholder="Calle y número"
                                            aria-label="Calle y número"
                                            className="form-field lg:col-span-3"
                                        />
                                        <input
                                            value={shippingAddress.line2}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line2: event.target.value }))}
                                            placeholder="Piso, depto (opcional)"
                                            aria-label="Piso y departamento"
                                            className="form-field lg:col-span-3"
                                        />
                                        <input
                                            value={shippingAddress.city}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, city: event.target.value }))}
                                            placeholder="Ciudad"
                                            aria-label="Ciudad"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.state}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, state: event.target.value }))}
                                            placeholder="Provincia"
                                            aria-label="Provincia"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.postalCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                                            placeholder="Código postal"
                                            aria-label="Código postal"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.countryCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))}
                                            placeholder="País (AR)"
                                            aria-label="Código de país"
                                            className="form-field"
                                            maxLength={2}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="play-panel p-6">
                                <div className="mx-auto max-w-xl text-center">
                                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--play-primary-container)]/20 text-[var(--play-primary)]">
                                        <Sparkles className="h-10 w-10" />
                                    </div>
                                    <h3 className="mb-2 text-2xl font-black text-[var(--play-text-main)]">{siteContent.preview.digitalCardTitle}</h3>
                                    <p className="mb-6 text-[var(--play-text-muted)]">
                                        {siteContent.preview.digitalCardCopy}
                                    </p>
                                    <div className="text-4xl font-black tracking-tight text-[var(--play-text-main)]">
                                        {checkoutCtaAmount}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <motion.aside
                    className="space-y-3 xl:sticky xl:top-28"
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/80 backdrop-blur-sm p-4">
                        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Formato</h4>
                        <div className="rounded-xl bg-[var(--play-surface-low)]/60 p-1">
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    onClick={() => setFormat("digital")}
                                    className={`rounded-lg px-3 py-2.5 text-[13px] font-bold transition-all ${format === "digital"
                                        ? "bg-white text-[var(--play-primary)] shadow-sm ring-1 ring-[var(--play-primary)]/10"
                                        : "text-[var(--play-text-muted)] hover:text-[var(--play-text-main)]"
                                        }`}
                                >
                                    Digital
                                </button>
                                <button
                                    onClick={() => setFormat("print")}
                                    className={`rounded-lg px-3 py-2.5 text-[13px] font-bold transition-all ${format === "print"
                                        ? "bg-white text-[var(--play-primary)] shadow-sm ring-1 ring-[var(--play-primary)]/10"
                                        : "text-[var(--play-text-muted)] hover:text-[var(--play-text-main)]"
                                        }`}
                                >
                                    Impreso
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/80 backdrop-blur-sm p-4">
                        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Moneda</h4>
                        <div className="rounded-xl bg-[var(--play-surface-low)]/60 p-1">
                            <div className="grid grid-cols-2 gap-1">
                                {(["ARS", "USD"] as const).map((currencyOption) => (
                                    <button
                                        key={currencyOption}
                                        onClick={() => setCurrency(currencyOption)}
                                        className={`rounded-lg px-3 py-2 text-[13px] font-bold transition-all ${currency === currencyOption
                                            ? "bg-white text-[var(--play-text-main)] shadow-sm ring-1 ring-[var(--play-primary)]/10"
                                            : "text-[var(--play-text-muted)] hover:text-[var(--play-text-main)]"
                                            }`}
                                    >
                                        {currencyOption}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="mt-3 text-xs font-medium text-[var(--play-text-muted)]">
                            El total final se confirma al iniciar el checkout.
                        </p>
                    </div>

                    <div className="rounded-[var(--play-radius-card)] border border-[var(--play-outline)]/15 bg-white/80 backdrop-blur-sm p-4">
                        <h4 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--play-primary)]">Resumen</h4>
                        <div className="space-y-2.5 text-[13px] text-[var(--play-text-muted)]">
                            <div className="flex items-center justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-[var(--play-text-main)]">{formatCurrency(subtotal, currency)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Formato</span>
                                <span className="font-bold text-[var(--play-text-main)]">{formatDetailLabel}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Envío</span>
                                <span className="font-bold text-[var(--play-text-main)]">{shippingValueLabel}</span>
                            </div>
                            <div className="border-t border-[var(--play-outline)]/20 pt-3 flex items-center justify-between">
                                <span className="text-sm font-bold text-[var(--play-text-main)]">Total estimado</span>
                                <span className="text-xl font-black text-[var(--play-text-main)]">{checkoutCtaAmount}</span>
                            </div>
                        </div>

                        {checkoutAvailabilityMessage && (
                            <div className="mt-4 rounded-xl border border-[var(--play-secondary-container)]/30 bg-[var(--play-secondary-container)]/10 px-4 py-3 text-[13px] text-[var(--play-text-main)]">
                                <div className="flex items-start gap-2.5">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--play-secondary-strong)]" />
                                    <div className="space-y-1.5">
                                        <p className="font-bold">Checkout en configuración</p>
                                        <p className="text-[var(--play-text-muted)]">{checkoutAvailabilityMessage}</p>
                                        <Link href="/contacto" className="inline-flex font-bold text-[var(--play-primary)] underline underline-offset-4 hover:no-underline">
                                            Contactanos
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}

                        <motion.button
                            onClick={handleCheckout}
                            disabled={isCheckingOut || !checkoutEnabled}
                            className="gummy-button play-primary-button mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold disabled:cursor-not-allowed disabled:opacity-50"
                            whileHover={prefersReducedMotion ? {} : { scale: 1.01 }}
                            whileTap={prefersReducedMotion ? {} : { scale: 0.98 }}
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Procesando...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    {checkoutLabel}
                                </>
                            )}
                        </motion.button>
                        <p className="mt-3 text-center text-[11px] text-[var(--play-text-muted)]">
                            {checkoutEnabled
                                ? "Pago protegido · Seguimiento completo"
                                : "Podés revisar todo el flujo. Pagos en configuración."}
                        </p>
                        {checkoutError && <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] font-medium text-red-700">{checkoutError}</p>}
                    </div>

                    <div className="grid gap-1.5 text-[11px]">
                        <div className="flex items-center gap-2 rounded-xl border border-[var(--play-outline)]/10 bg-white/60 px-3 py-2 text-[var(--play-accent-success)]">
                            <Clock3 className="h-3.5 w-3.5" />
                            {deliveryCopy}
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-[var(--play-outline)]/10 bg-white/60 px-3 py-2 text-[var(--play-primary)]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Checkout seguro
                        </div>
                        <div className="flex items-center gap-2 rounded-xl border border-[var(--play-outline)]/10 bg-white/60 px-3 py-2 text-[var(--play-secondary-strong)]">
                            {format === "print" ? <Truck className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                            Seguimiento completo
                        </div>
                    </div>
                </motion.aside>
            </div>
        </div>
    )
}
