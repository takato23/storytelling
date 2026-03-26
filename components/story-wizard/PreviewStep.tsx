"use client"

import React, { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, CheckCircle2, Clock3, Loader2, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { AlchemistLoading } from "@/components/story-wizard/AlchemistLoading"
import { FlipbookPreview } from "@/components/story-wizard/FlipbookPreview"
import { PrintConfigurator, PrintConfig } from "@/components/features/print/PrintConfigurator"
import { STORIES } from "@/lib/stories"
import { findStoryMockByIdOrSlug, siteContent } from "@/lib/site-content"
import { ReadingLevel } from "@/components/features/education/ReadingLevelSelector"
import { useRouter } from "next/navigation"
import { captureEvent } from "@/lib/analytics/events"

const PIXAR_STYLE = { id: "pixar", name: "Pixar 3D", image: "/stories/space-1.jpg" }

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
        imageUrl: string
        sceneText: string
    } | null
    previewError: string | null
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
}: PreviewStepProps) {
    const story = STORIES.find((s) => s.id === data.selectedStory)
    const storyMock = findStoryMockByIdOrSlug(data.selectedStory)
    const style = PIXAR_STYLE
    const previewUrl = generatedPreview?.imageUrl ?? null
    const familyCount = data.familyMembers?.length || 0
    const [format, setFormat] = useState<"digital" | "print">("print")
    const [currency, setCurrency] = useState<"USD" | "ARS">("ARS")
    const [isCheckingOut, setIsCheckingOut] = useState(false)
    const [checkoutError, setCheckoutError] = useState<string | null>(null)
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
    const deliveryCopy = format === "print"
        ? `Digital inmediato + impreso ${quotePreview?.shippingEtaDays ? `${quotePreview.shippingEtaDays} días` : "5-10 días"}`
        : "Entrega digital inmediata"
    const checkoutLabel = format === "print" ? siteContent.preview.checkoutCtaPrint : siteContent.preview.checkoutCtaDigital
    const checkoutCtaAmount = formatCurrency(total, currency)
    const formatDetailLabel = format === "print" && story
        ? `${story.printSpecs.format} · ${story.printSpecs.size}`
        : "Versión digital"
    const shippingValueLabel = format === "digital"
        ? "Incluido"
        : quotePreview?.currency === currency
            ? formatCurrency(shipping, currency)
            : "Cotizar envío"

    const flipbookPages = useMemo(() => {
        if (!story) return []

        return Array.from({ length: 6 }).map((_, i) => ({
            id: `page-${i}`,
            pageNumber: i + 1,
            imageUrl:
                i === 0 && generatedPreview?.imageUrl
                    ? generatedPreview.imageUrl
                    : "https://images.unsplash.com/photo-1519681393784-d120267933ba",
            text:
                i === 0 && generatedPreview?.sceneText
                    ? generatedPreview.sceneText
                    : `Página ${i + 1}: ${story.shortDescription} - Una escena mágica donde ${data.childName} vive una aventura increíble.`,
        }))
    }, [story, generatedPreview, data.childName])

    const handleCheckout = async () => {
        if (!story || !data.childName || isCheckingOut) return
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
            <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
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
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="play-panel overflow-hidden p-4 md:p-5"
                    >
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 px-1">
                            <p className="text-sm font-semibold text-[var(--play-text-main)]">{siteContent.preview.previewTitle}</p>
                            <div className="play-pill px-3 py-1.5 text-[11px]">
                                {story?.title || "Tu cuento"}
                            </div>
                        </div>
                        {isGenerating ? (
                            <AlchemistLoading />
                        ) : (
                            <FlipbookPreview title={story?.title || "Tu Cuento"} pages={flipbookPages} />
                        )}
                        {previewError && (
                            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{previewError}</p>
                                </div>
                            </div>
                        )}
                        <p className="mt-4 rounded-2xl border border-[var(--nido-line)] bg-white/75 px-4 py-3 text-sm leading-6 text-[var(--play-text-muted)]">
                            {storyMock?.previewPromise ?? siteContent.preview.sampleNote}
                        </p>
                    </motion.div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="play-card p-4">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Protagonista</p>
                            <div className="flex items-center gap-3">
                                {previewUrl ? (
                                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl shadow-sm">
                                        <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--play-surface-low)] text-[var(--play-primary)]">
                                        <Sparkles className="h-7 w-7" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-base font-black text-[var(--play-text-main)]">{data.childName || "Pendiente"}</h3>
                                    <p className="text-sm font-medium text-[var(--play-text-muted)]">{data.childAge} años</p>
                                    <p className="mt-1 text-xs font-bold text-[var(--play-primary)]">Nivel {readingLevelLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div className="play-card p-4">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Historia</p>
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-sm">
                                    <img src={story?.coverImage} alt={story?.title} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black leading-tight text-[var(--play-text-main)]">{story?.title}</h4>
                                    <p className="text-sm font-medium text-[var(--play-text-muted)]">{story?.ages}</p>
                                </div>
                            </div>
                        </div>

                        <div className="play-card p-4">
                            <p className="mb-2 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Estilo</p>
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 overflow-hidden rounded-2xl shadow-sm">
                                    <img src={style?.image} alt={style?.name} className="h-full w-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-base font-black text-[var(--play-text-main)]">{style?.name || "Personalizado"}</h4>
                                    <p className="text-sm font-medium text-[var(--play-text-muted)]">
                                        {familyCount > 0 ? `+${familyCount} familiares` : "Hasta 2 previews gratis"}
                                    </p>
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
                                            className="form-field lg:col-span-2"
                                        />
                                        <input
                                            value={shippingAddress.phone}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, phone: event.target.value }))}
                                            placeholder="Teléfono (opcional)"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.line1}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line1: event.target.value }))}
                                            placeholder="Calle y número"
                                            className="form-field lg:col-span-3"
                                        />
                                        <input
                                            value={shippingAddress.line2}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, line2: event.target.value }))}
                                            placeholder="Piso, depto (opcional)"
                                            className="form-field lg:col-span-3"
                                        />
                                        <input
                                            value={shippingAddress.city}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, city: event.target.value }))}
                                            placeholder="Ciudad"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.state}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, state: event.target.value }))}
                                            placeholder="Provincia"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.postalCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, postalCode: event.target.value }))}
                                            placeholder="Código postal"
                                            className="form-field"
                                        />
                                        <input
                                            value={shippingAddress.countryCode}
                                            onChange={(event) => setShippingAddress((prev) => ({ ...prev, countryCode: event.target.value.toUpperCase() }))}
                                            placeholder="País (AR)"
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="play-panel p-4">
                        <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Formato</h4>
                        <div className="rounded-2xl bg-[var(--play-surface-low)] p-1.5">
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setFormat("digital")}
                                    className={`rounded-xl px-3 py-3 text-sm font-bold transition ${format === "digital"
                                        ? "bg-white text-[var(--play-primary)] shadow-sm"
                                        : "text-[var(--play-text-muted)]"
                                        }`}
                                >
                                    Descarga online
                                </button>
                                <button
                                    onClick={() => setFormat("print")}
                                    className={`rounded-xl px-3 py-3 text-sm font-bold transition ${format === "print"
                                        ? "bg-white text-[var(--play-primary)] shadow-sm"
                                        : "text-[var(--play-text-muted)]"
                                        }`}
                                >
                                    Impresión
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="play-panel p-4">
                        <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Moneda</h4>
                        <div className="rounded-2xl bg-[var(--play-surface-low)] p-1.5">
                            <div className="grid grid-cols-2 gap-2">
                                {(["ARS", "USD"] as const).map((currencyOption) => (
                                    <button
                                        key={currencyOption}
                                        onClick={() => setCurrency(currencyOption)}
                                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${currency === currencyOption
                                            ? "bg-white text-[var(--play-text-main)] shadow-sm"
                                            : "text-[var(--play-text-muted)]"
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

                    <div className="play-panel p-4">
                        <h4 className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-[var(--play-primary)]">Tu pedido mágico</h4>
                        <div className="space-y-3 text-sm font-medium text-[var(--play-text-muted)]">
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
                            <div className="border-t border-[var(--play-outline)] pt-3 flex items-center justify-between text-base">
                                <span className="font-bold text-[var(--play-text-main)]">Total estimado</span>
                                <span className="text-2xl font-black text-[var(--play-text-main)]">{checkoutCtaAmount}</span>
                            </div>
                        </div>

                        <motion.button
                            onClick={handleCheckout}
                            disabled={isCheckingOut}
                            className="gummy-button play-secondary-button mt-6 flex w-full items-center justify-center gap-2 px-6 py-4 text-lg disabled:cursor-not-allowed disabled:opacity-60"
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isCheckingOut ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    Iniciando checkout...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="h-5 w-5" />
                                    {checkoutLabel}
                                </>
                            )}
                        </motion.button>
                        <p className="mt-4 text-center text-xs font-medium text-[var(--play-text-muted)]">
                            Pago protegido y seguimiento completo del pedido.
                        </p>
                        {checkoutError && <p className="mt-3 text-sm text-red-600">{checkoutError}</p>}
                    </div>

                    <div className="grid gap-2 text-xs">
                        <div className="play-card-soft flex items-center gap-2 px-3 py-2 text-[#38643e]">
                            <Clock3 className="h-4 w-4" />
                            {deliveryCopy}
                        </div>
                        <div className="play-card-soft flex items-center gap-2 px-3 py-2 text-[var(--play-primary)]">
                            <ShieldCheck className="h-4 w-4" />
                            Checkout seguro
                        </div>
                        <div className="play-card-soft flex items-center gap-2 px-3 py-2 text-[#5c4900]">
                            {format === "print" ? <Truck className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                            Seguimiento completo
                        </div>
                    </div>
                </motion.aside>
            </div>
        </div>
    )
}
