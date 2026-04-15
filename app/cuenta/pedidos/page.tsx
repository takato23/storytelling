"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BookHeart,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileArchive,
  FileText,
  LogOut,
  Package,
  Printer,
  RefreshCcw,
  Sparkles,
  Sticker,
} from "lucide-react"
import { createSupabaseBrowserClient } from "@/lib/supabase/browser"
import { hasSupabaseCredentials } from "@/lib/supabase/env"

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

type OrderType = "book" | "sticker"
type OrderStatus = string
type OrderFilter = "all" | "books" | "stickers" | "ready"

interface AccountOrder {
  id: string
  type: OrderType
  status: OrderStatus
  format: string
  amount: number
  currency: string
  createdAt: string
  title: string
  coverImage: string | null
  pdfUrl: string | null
  viewerUrl: string | null
  printPdfUrl: string | null
  printZipUrl: string | null
  /* sticker-specific */
  customerName?: string
  childGender?: string
  themes?: string[]
  quantity?: number
  previewImageUrl?: string | null
}

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending_payment: "Pendiente de pago",
  paid: "Pagado",
  generating: "Generando",
  qa_pending: "Revisión pendiente",
  ready_print_assets: "Listo para imprenta",
  qa_failed: "Revisión fallida",
  ready_digital: "Digital listo",
  print_queued: "Cola de impresión",
  in_production: "En producción",
  packed: "Empaquetado",
  shipped: "Enviado",
  delivered: "Entregado",
  refunded: "Reembolsado",
  cancelled: "Cancelado",
  failed: "Fallido",
}

/*
 * Status badge colors — intentionally semantic Tailwind colors (not brand)
 * since they represent system states that need immediate visual distinction.
 * Grouped by lifecycle phase for easier maintenance.
 */
const STATUS_COLORS: Record<string, string> = {
  // Draft / Inactive
  draft: "bg-slate-100 text-slate-600",
  cancelled: "bg-slate-100 text-slate-600",
  // Payment
  pending_payment: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  paid: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  refunded: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  // Generation
  generating: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  qa_pending: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  qa_failed: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  // Ready
  ready_digital: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  ready_print_assets: "bg-teal-50 text-teal-700 ring-1 ring-teal-200",
  // Print production
  print_queued: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  in_production: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  packed: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  shipped: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
  delivered: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  // Error
  failed: "bg-red-50 text-red-700 ring-1 ring-red-200",
}

const FILTERS: Array<{ id: OrderFilter; label: string; icon: typeof BookHeart }> = [
  { id: "all", label: "Todos", icon: Sparkles },
  { id: "books", label: "Libros", icon: BookHeart },
  { id: "stickers", label: "Stickers", icon: Sticker },
  { id: "ready", label: "Listos", icon: Download },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: currency === "ARS" ? "ARS" : "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(new Date(value))
}

function getProgress(status: string, format: string) {
  if (["failed", "cancelled", "refunded"].includes(status)) return 100
  const map: Record<string, number> = {
    draft: 10, pending_payment: 20, paid: 35, generating: 55, qa_pending: 68,
    ready_print_assets: 74, qa_failed: 74,
    ready_digital: format === "digital" ? 100 : 65,
    print_queued: 72, in_production: 80, packed: 88, shipped: 95, delivered: 100,
  }
  return map[status] ?? 20
}

function isReadyOrder(status: string) {
  return ["ready_digital", "ready_print_assets", "delivered", "paid"].includes(status)
}

function getFormatLabel(format: string) {
  if (format === "print") return "Impreso + digital"
  if (format === "sticker") return "Stickers"
  return "Digital"
}

/* ------------------------------------------------------------------ */
/*  Components                                                        */
/* ------------------------------------------------------------------ */

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 rounded-2xl border border-white/60 bg-white/70 p-4 backdrop-blur-xl"
        >
          <div className="h-20 w-14 shrink-0 animate-pulse rounded-xl bg-charcoal-100" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded-full bg-charcoal-100" />
            <div className="h-3 w-56 animate-pulse rounded-full bg-charcoal-100" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-full bg-charcoal-100" />
        </div>
      ))}
    </div>
  )
}

function ActionButton({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string
  icon: typeof Download
  label: string
  primary?: boolean
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition hover:-translate-y-0.5 ${
        primary
          ? "bg-charcoal-900 text-white shadow-md hover:bg-black"
          : "border border-charcoal-200 bg-white text-charcoal-700 hover:border-charcoal-300 hover:bg-charcoal-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </a>
  )
}

function OrderCard({ order }: { order: AccountOrder }) {
  const progress = getProgress(order.status, order.format)
  const hasDownloads = order.pdfUrl || order.viewerUrl || order.printPdfUrl || order.printZipUrl || order.previewImageUrl
  const isSticker = order.type === "sticker"

  return (
    <article className="group overflow-hidden rounded-2xl border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(255,247,242,0.78))] p-4 shadow-[0_20px_50px_-30px_rgba(64,40,69,0.28)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-30px_rgba(64,40,69,0.35)] md:p-5">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="relative h-24 w-[68px] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-charcoal-800 to-charcoal-900 md:h-28 md:w-20">
          {order.coverImage ? (
            <img
              src={order.coverImage}
              alt={order.title}
              className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/40">
              {isSticker ? <Sticker className="h-6 w-6" /> : <BookHeart className="h-6 w-6" />}
            </div>
          )}
          <span className="absolute left-1 top-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
            {isSticker ? "Sticker" : order.format === "print" ? "Print" : "Digital"}
          </span>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Row 1: Title + actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold leading-tight text-charcoal-900 md:text-lg">
                {order.title}
              </h3>
              <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-charcoal-500">
                <span>{getFormatLabel(order.format)}</span>
                <span className="text-charcoal-300">·</span>
                <span>{formatDate(order.createdAt)}</span>
                <span className="text-charcoal-300">·</span>
                <span className="font-medium text-charcoal-700">{formatCurrency(order.amount, order.currency)}</span>
              </p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_COLORS[order.status] ?? "bg-charcoal-100 text-charcoal-600"}`}>
              {STATUS_LABELS[order.status] ?? order.status}
            </span>
          </div>

          {/* Sticker extra info */}
          {isSticker && order.themes && order.themes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {order.themes.map((theme) => (
                <span key={theme} className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-purple-200">
                  {theme}
                </span>
              ))}
              {order.childGender && (
                <span className="rounded-full bg-pink-50 px-2 py-0.5 text-[10px] font-medium text-pink-700 ring-1 ring-pink-200">
                  {order.childGender === "niña" ? "👧 Niña" : "👦 Niño"}
                </span>
              )}
              {order.quantity && order.quantity > 1 && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">
                  x{order.quantity}
                </span>
              )}
            </div>
          )}

          {/* Progress bar (book orders only, non-final states) */}
          {!isSticker && !["delivered", "cancelled", "failed", "refunded"].includes(order.status) && (
            <div className="mt-2.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-charcoal-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-coral-400 via-gold-300 to-teal-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-semibold text-charcoal-400">{progress}%</span>
            </div>
          )}

          {/* Action buttons — prominent, at the top level */}
          {hasDownloads && (
            <div className="mt-3 flex flex-wrap gap-2">
              {order.pdfUrl && (
                <ActionButton href={order.pdfUrl} icon={Download} label="PDF" primary />
              )}
              {order.printPdfUrl && (
                <ActionButton href={order.printPdfUrl} icon={FileText} label="PDF imprenta" />
              )}
              {order.printZipUrl && (
                <ActionButton href={order.printZipUrl} icon={FileArchive} label="ZIP imprenta" />
              )}
              {order.viewerUrl && (
                <ActionButton href={order.viewerUrl} icon={Eye} label="Leer online" />
              )}
              {isSticker && order.previewImageUrl && (
                <ActionButton href={order.previewImageUrl} icon={Download} label="Descargar preview" primary />
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AccountOrdersPage() {
  const router = useRouter()
  const supabase = useMemo(() => {
    if (!hasSupabaseCredentials()) return null
    return createSupabaseBrowserClient()
  }, [])

  const [orders, setOrders] = useState<AccountOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<OrderFilter>("all")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true

    async function loadOrders() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/me/orders", { cache: "no-store" })

        if (response.status === 401) {
          router.replace("/login?next=%2Fcuenta%2Fpedidos")
          return
        }

        const payload = await response.json().catch(() => ({}))

        if (!response.ok) {
          if (mounted) {
            setError(payload.message ?? payload.error ?? "No se pudieron cargar tus pedidos.")
            setIsLoading(false)
          }
          return
        }

        if (mounted) {
          setOrders(Array.isArray(payload.orders) ? payload.orders : [])
          setIsLoading(false)
        }
      } catch {
        if (mounted) {
          setError("No se pudo conectar con tu historial de pedidos.")
          setIsLoading(false)
        }
      }
    }

    void loadOrders()

    return () => {
      mounted = false
    }
  }, [reloadKey, router])

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/")
    router.refresh()
  }

  const filteredOrders = useMemo(() => {
    if (filter === "all") return orders
    if (filter === "books") return orders.filter((o) => o.type === "book")
    if (filter === "stickers") return orders.filter((o) => o.type === "sticker")
    if (filter === "ready") return orders.filter((o) => isReadyOrder(o.status))
    return orders
  }, [orders, filter])

  const filterCounts = useMemo<Record<OrderFilter, number>>(
    () => ({
      all: orders.length,
      books: orders.filter((o) => o.type === "book").length,
      stickers: orders.filter((o) => o.type === "sticker").length,
      ready: orders.filter((o) => isReadyOrder(o.status)).length,
    }),
    [orders],
  )

  return (
    <main className="relative min-h-screen overflow-hidden px-4 pb-16 pt-28 md:px-6 md:pb-24 md:pt-32">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_var(--page-orb-a),_transparent_68%)] blur-3xl" />
        <div className="absolute right-[-6%] top-40 h-80 w-80 rounded-full bg-[radial-gradient(circle,_var(--page-orb-b),_transparent_70%)] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-[radial-gradient(circle,_var(--page-orb-c),_transparent_72%)] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-4xl space-y-5">
        {/* ── Compact header ── */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-3xl leading-none text-charcoal-900 md:text-4xl">
              Mis pedidos
            </h1>
            <p className="mt-1 text-sm text-charcoal-500">
              Tus cuentos y stickers, en un solo lugar.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick stat pills */}
            {!isLoading && orders.length > 0 && (
              <div className="hidden items-center gap-2 sm:flex">
                <span className="rounded-full bg-white/80 px-3 py-1.5 text-xs font-semibold text-charcoal-600 shadow-sm ring-1 ring-charcoal-100">
                  {filterCounts.all} pedidos
                </span>
                {filterCounts.ready > 0 && (
                  <span className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                    {filterCounts.ready} listos
                  </span>
                )}
              </div>
            )}

            <button
              onClick={() => setReloadKey((v) => v + 1)}
              className="rounded-full border border-charcoal-200 bg-white/80 p-2.5 text-charcoal-600 transition hover:bg-white hover:text-charcoal-900"
              title="Actualizar"
            >
              <RefreshCcw className="h-4 w-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-charcoal-600 transition hover:bg-white hover:text-charcoal-900"
            >
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </button>
          </div>
        </header>

        {/* ── Filter pills ── */}
        <nav className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => {
            const selected = filter === f.id
            const Icon = f.icon
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "bg-charcoal-900 text-white shadow-md"
                    : "bg-white/80 text-charcoal-600 ring-1 ring-charcoal-100 hover:bg-white hover:text-charcoal-900"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {f.label}
                <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${selected ? "bg-white/15" : "bg-charcoal-100 text-charcoal-500"}`}>
                  {filterCounts[f.id]}
                </span>
              </button>
            )
          })}
        </nav>

        {/* ── Loading ── */}
        {isLoading && <LoadingSkeleton />}

        {/* ── Error ── */}
        {!isLoading && error && (
          <section className="rounded-2xl border border-red-200 bg-white/85 p-5 shadow-md backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-red-50 p-2.5 text-red-600">
                <CircleAlert className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-semibold text-charcoal-900">No pudimos cargar tus pedidos</h2>
                <p className="mt-1 text-sm text-charcoal-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => setReloadKey((v) => v + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </section>
        )}

        {/* ── Empty state ── */}
        {!isLoading && !error && orders.length === 0 && (
          <section className="rounded-2xl border border-white/60 bg-white/80 p-8 text-center shadow-md backdrop-blur-xl">
            <div className="mx-auto flex max-w-sm flex-col items-center">
              <div className="rounded-full bg-gradient-to-br from-coral-50 to-teal-50 p-5">
                <BookHeart className="h-8 w-8 text-coral-500" />
              </div>
              <h2 className="mt-5 font-serif text-2xl text-charcoal-900">
                Todavía no hay pedidos
              </h2>
              <p className="mt-2 text-sm text-charcoal-500">
                Cuando compres un cuento o stickers, van a aparecer acá.
              </p>
              <Link
                href="/nuestros-libros"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-charcoal-900 px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-black"
              >
                Explorar cuentos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>
        )}

        {/* ── Orders list ── */}
        {!isLoading && !error && orders.length > 0 && (
          <section className="space-y-3">
            {filteredOrders.length === 0 && (
              <div className="rounded-2xl border border-white/60 bg-white/80 px-5 py-4 text-center text-sm text-charcoal-500 backdrop-blur-xl">
                No hay pedidos para este filtro.
              </div>
            )}

            {filteredOrders.map((order) => (
              <OrderCard key={`${order.type}-${order.id}`} order={order} />
            ))}
          </section>
        )}

        {/* ── Bottom CTA ── */}
        {!isLoading && !error && orders.length > 0 && (
          <div className="flex justify-center pt-2">
            <Link
              href="/nuestros-libros"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-charcoal-600 transition hover:text-charcoal-900"
            >
              Explorar más cuentos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
