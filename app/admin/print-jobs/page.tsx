"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getPrintProduct } from "@/lib/print-products";

type JobFilter = "all" | "review_required" | "approved" | "in_production" | "exceptions";

type PrintJobStatus =
  | "review_required"
  | "approved"
  | "in_production"
  | "packed"
  | "shipped"
  | "delivered"
  | "failed"
  | "cancelled";

interface PrintJobRow {
  id: string;
  status: PrintJobStatus;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  sla_due_at: string | null;
  order: {
    id: string;
    status: string;
    user_id: string;
    currency: string;
    total: number;
    created_at: string;
  } | null;
  item: {
    format: string;
    story_id: string;
    print_options: Record<string, unknown>;
    story_title: string;
  } | null;
  assets: {
    print_pdf_url: string | null;
    print_zip_url: string | null;
    thumbnail_url: string | null;
  };
  qa_summary: {
    total_pages: number;
    ready_pages: number;
    failed_pages: number;
    pages: Array<{
      page_number: number;
      image_url: string | null;
      status: string;
      error_message: string | null;
      width_px: number | null;
      height_px: number | null;
    }>;
  };
  shipping_address: {
    recipient_name: string;
    city: string;
    state: string | null;
    postal_code: string;
  } | null;
}

function describePrintOptions(options: Record<string, unknown> | undefined) {
  const productId = typeof options?.productId === "string" ? options.productId : null;
  const includeGiftWrap = options?.includeGiftWrap === true;
  const product = getPrintProduct(productId as Parameters<typeof getPrintProduct>[0]);

  return {
    label: product.shortTitle,
    details: `${product.basePages} pág. base${includeGiftWrap ? " + regalo" : ""}`,
  };
}

const TRANSITIONS: Record<PrintJobStatus, PrintJobStatus[]> = {
  review_required: ["approved", "failed", "cancelled"],
  approved: ["in_production", "failed", "cancelled"],
  in_production: ["packed", "failed", "cancelled"],
  packed: ["shipped", "failed", "cancelled"],
  shipped: ["delivered", "failed"],
  delivered: [],
  failed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<PrintJobStatus, string> = {
  review_required: "Pendiente de revisión",
  approved: "Aprobado",
  in_production: "En producción",
  packed: "Empaquetado",
  shipped: "Despachado",
  delivered: "Entregado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

function compactDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AdminPrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [customGeneratingId, setCustomGeneratingId] = useState<string | null>(null);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [targetByJob, setTargetByJob] = useState<Record<string, PrintJobStatus>>({});
  const [trackingByJob, setTrackingByJob] = useState<Record<string, string>>({});
  const [promptByPage, setPromptByPage] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<JobFilter>("all");

  const activeJobs = useMemo(
    () => jobs.filter((job) => !["delivered", "cancelled", "failed"].includes(job.status)),
    [jobs],
  );

  const pendingReview = useMemo(() => jobs.filter((job) => job.status === "review_required").length, [jobs]);
  const withFailures = useMemo(() => jobs.filter((job) => job.qa_summary.failed_pages > 0).length, [jobs]);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter === "review_required" && job.status !== "review_required") return false;
      if (filter === "approved" && job.status !== "approved") return false;
      if (filter === "in_production" && !["in_production", "packed", "shipped"].includes(job.status)) return false;
      if (filter === "exceptions" && job.qa_summary.failed_pages === 0 && job.status !== "failed") return false;

      if (!normalizedSearch) return true;

      const haystack = [
        job.item?.story_title ?? "",
        job.order?.id ?? "",
        job.shipping_address?.recipient_name ?? "",
        job.shipping_address?.city ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [filter, jobs, search]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/print-jobs");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cargar la cola de impresión.");
      }
      const rows = (payload.print_jobs ?? []) as PrintJobRow[];
      setJobs(rows);
      setTargetByJob((prev) => {
        const next = { ...prev };
        for (const row of rows) {
          const candidate = TRANSITIONS[row.status][0];
          if (candidate) next[row.id] = candidate;
        }
        return next;
      });
      if (rows.length > 0 && !expandedJobId) {
        setExpandedJobId(rows[0].id);
      }
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No se pudo cargar la cola.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [expandedJobId]);

  async function handleTransition(job: PrintJobRow) {
    const target = targetByJob[job.id];
    if (!target) return;

    setTransitioningId(job.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/print-jobs/${job.id}/transition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to_status: target,
          tracking_number: trackingByJob[job.id] || undefined,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo transicionar el print job.");
      }
      await loadJobs();
    } catch (transitionError) {
      const message = transitionError instanceof Error ? transitionError.message : "Error de transición.";
      setError(message);
    } finally {
      setTransitioningId(null);
    }
  }

  async function handleRetry(job: PrintJobRow, pageNumber?: number) {
    setRetryingId(pageNumber ? `${job.id}:${pageNumber}` : job.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/print-jobs/${job.id}/retry-pages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pageNumber ? { page_number: pageNumber } : {}),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron reintentar las páginas.");
      }
      await loadJobs();
    } catch (retryError) {
      const message = retryError instanceof Error ? retryError.message : "Error al reintentar páginas.";
      setError(message);
    } finally {
      setRetryingId(null);
    }
  }

  async function handleCustomPrompt(job: PrintJobRow, pageNumber: number) {
    const key = `${job.id}:${pageNumber}`;
    const prompt = promptByPage[key]?.trim();
    if (!prompt || prompt.length < 20) {
      setError("Escribí un prompt más claro antes de regenerar la imagen.");
      return;
    }

    setCustomGeneratingId(key);
    setError(null);
    try {
      const response = await fetch(`/api/admin/print-jobs/${job.id}/custom-page`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_number: pageNumber,
          prompt,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo generar la imagen personalizada.");
      }
      await loadJobs();
    } catch (customError) {
      const message = customError instanceof Error ? customError.message : "Error al generar imagen manual.";
      setError(message);
    } finally {
      setCustomGeneratingId(null);
    }
  }

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const savedFilter = window.localStorage.getItem("storymagic-admin-print-filter");
    const savedSearch = window.localStorage.getItem("storymagic-admin-print-search");
    const savedExpanded = window.localStorage.getItem("storymagic-admin-print-expanded");
    if (savedFilter === "all" || savedFilter === "review_required" || savedFilter === "approved" || savedFilter === "in_production" || savedFilter === "exceptions") {
      setFilter(savedFilter);
    }
    if (savedSearch) setSearch(savedSearch);
    if (savedExpanded) setExpandedJobId(savedExpanded);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("storymagic-admin-print-filter", filter);
    window.localStorage.setItem("storymagic-admin-print-search", search);
    if (expandedJobId) {
      window.localStorage.setItem("storymagic-admin-print-expanded", expandedJobId);
    }
  }, [expandedJobId, filter, search]);

  return (
    <main className="space-y-5">
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Pedidos físicos</h1>
            <p className="mt-1 text-sm text-white/40">
              Revisá, regenerá y aprobá libros antes de enviarlos a imprenta.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 ring-1 ring-indigo-500/10">
            <p className="text-xs uppercase tracking-wide text-white/40">Activos</p>
            <p className="text-2xl font-bold text-white">{activeJobs.length}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 ring-1 ring-amber-500/10">
            <p className="text-xs uppercase tracking-wide text-white/40">Revisión</p>
            <p className="text-2xl font-bold text-white">{pendingReview}</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 ring-1 ring-rose-500/10">
            <p className="text-xs uppercase tracking-wide text-white/40">Con fallas</p>
            <p className="text-2xl font-bold text-white">{withFailures}</p>
          </div>
          <button
            onClick={() => void loadJobs()}
            className="rounded-xl border border-white/[0.06] bg-indigo-500/10 px-4 py-3 text-left text-indigo-300 ring-1 ring-indigo-500/20 transition hover:bg-indigo-500/15"
          >
            <p className="text-sm font-semibold">Refrescar</p>
            <p className="text-xs text-indigo-300/60">Actualizar estados y assets</p>
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {([
              ["all", "Todos"],
              ["review_required", "Revisión"],
              ["approved", "Aprobados"],
              ["in_production", "Producción"],
              ["exceptions", "Excepciones"],
            ] as Array<[JobFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  filter === value
                    ? "bg-white text-charcoal-900 shadow-md shadow-black/20"
                    : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por cuento, pedido, cliente o ciudad"
            className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 md:max-w-sm"
          />
        </div>

        {error && <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</p>}

        <section className="rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          <div className="hidden grid-cols-[1.1fr_1fr_0.8fr_0.7fr_0.7fr_0.7fr_48px] gap-3 border-b border-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-white/35 lg:grid">
            <span>Pedido</span>
            <span>Cliente / envío</span>
            <span>Producto</span>
            <span>Estado</span>
            <span>QA</span>
            <span>Actualizado</span>
            <span />
          </div>

          {loading ? (
            <div className="px-4 py-6 text-sm text-white/40">Cargando jobs...</div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-4 py-6 text-sm text-white/40">No hay trabajos de impresión en cola.</div>
          ) : (
            filteredJobs.map((job) => {
              const printDetails = describePrintOptions(job.item?.print_options);
              const expanded = expandedJobId === job.id;
              const allowed = TRANSITIONS[job.status];

              return (
                <div key={job.id} className="border-b border-white/[0.04] last:border-b-0">
                  <div className="grid gap-3 px-4 py-3 text-sm lg:grid-cols-[1.1fr_1fr_0.8fr_0.7fr_0.7fr_0.7fr_48px]">
                    <div>
                      <p className="font-semibold text-white">{job.item?.story_title ?? "Cuento"}</p>
                      <p className="text-xs text-white/40">#{job.order?.id.slice(0, 8)} · {job.order?.currency} {job.order?.total?.toFixed(2)}</p>
                    </div>
                    <div className="text-xs text-white/50 lg:block">
                      <p>{job.shipping_address?.recipient_name ?? "Sin envío"}</p>
                      <p>{job.shipping_address ? `${job.shipping_address.city}${job.shipping_address.state ? `, ${job.shipping_address.state}` : ""}` : "-"}</p>
                    </div>
                    <div className="text-xs text-white/50">
                      <p>{printDetails.label}</p>
                      <p>{printDetails.details}</p>
                    </div>
                    <div>
                      <span className="rounded-full bg-indigo-500/15 px-2 py-1 text-[11px] font-semibold text-indigo-300 ring-1 ring-indigo-500/20">
                        {STATUS_LABELS[job.status]}
                      </span>
                    </div>
                    <div className="text-xs text-white/50">
                      <p>{job.qa_summary.ready_pages}/{job.qa_summary.total_pages} listas</p>
                      <p className={job.qa_summary.failed_pages > 0 ? "text-rose-400" : ""}>{job.qa_summary.failed_pages} fallidas</p>
                    </div>
                    <div className="text-xs text-white/35">{compactDate(job.updated_at)}</div>
                    <button
                      onClick={() => setExpandedJobId((prev) => (prev === job.id ? null : job.id))}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:bg-white/[0.06]"
                    >
                      {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {expanded && (
                    <div className="border-t border-white/[0.06] bg-white/[0.02] px-4 py-4">
                      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {job.assets.print_pdf_url && (
                              <a
                                href={job.assets.print_pdf_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-charcoal-900 shadow-sm transition hover:-translate-y-0.5"
                              >
                                PDF imprenta
                              </a>
                            )}
                            {job.assets.print_zip_url && (
                              <a
                                href={job.assets.print_zip_url}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10"
                              >
                                ZIP páginas
                              </a>
                            )}
                            {job.qa_summary.failed_pages > 0 && (
                              <button
                                onClick={() => void handleRetry(job)}
                                disabled={retryingId === job.id}
                                className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/15 disabled:opacity-60"
                              >
                                {retryingId === job.id ? "Reintentando..." : "Reintentar fallidas"}
                              </button>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-3">
                            {job.qa_summary.pages.map((page) => {
                              const promptKey = `${job.id}:${page.page_number}`;
                              return (
                                <div key={promptKey} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-3">
                                  <div className="mb-2 aspect-[1.42/1] overflow-hidden rounded-xl bg-black/30">
                                    {page.image_url ? (
                                      <img
                                        src={page.image_url}
                                        alt={`Página ${page.page_number}`}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-xs text-white/30">
                                        Sin imagen
                                      </div>
                                    )}
                                  </div>
                                  <div className="space-y-1 text-[11px] text-white/50">
                                    <p className="font-semibold text-white/80">Página {page.page_number}</p>
                                    <p>{page.width_px && page.height_px ? `${page.width_px}x${page.height_px}px` : "Sin medidas"}</p>
                                    <p>Estado: {page.status}</p>
                                    {page.error_message && <p className="text-amber-400">{page.error_message}</p>}
                                  </div>

                                  <div className="mt-3 space-y-2">
                                    {page.status === "failed" && (
                                      <button
                                        onClick={() => void handleRetry(job, page.page_number)}
                                        disabled={retryingId === `${job.id}:${page.page_number}`}
                                        className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1.5 text-[11px] font-semibold text-amber-300 disabled:opacity-60"
                                      >
                                        {retryingId === `${job.id}:${page.page_number}` ? "Reintentando..." : "Reintentar"}
                                      </button>
                                    )}
                                    <textarea
                                      value={promptByPage[promptKey] ?? ""}
                                      onChange={(event) =>
                                        setPromptByPage((prev) => ({
                                          ...prev,
                                          [promptKey]: event.target.value,
                                        }))
                                      }
                                      placeholder="Prompt manual para regenerar esta página con Gemini..."
                                      className="min-h-24 w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                    />
                                    <button
                                      onClick={() => void handleCustomPrompt(job, page.page_number)}
                                      disabled={customGeneratingId === promptKey}
                                      className="w-full rounded-lg bg-white px-2 py-2 text-[11px] font-semibold text-charcoal-900 shadow-sm disabled:opacity-60"
                                    >
                                      {customGeneratingId === promptKey ? "Generando..." : "Generar con prompt"}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
                          <div>
                            <p className="mb-2 text-sm font-semibold text-white/80">Acciones</p>
                            {allowed.length === 0 ? (
                              <p className="text-xs text-white/35">Sin transición disponible</p>
                            ) : (
                              <div className="space-y-2">
                                <select
                                  value={targetByJob[job.id] ?? allowed[0]}
                                  onChange={(event) =>
                                    setTargetByJob((prev) => ({
                                      ...prev,
                                      [job.id]: event.target.value as PrintJobStatus,
                                    }))
                                  }
                                  className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                                >
                                  {allowed.map((status) => (
                                    <option key={status} value={status} className="bg-charcoal-900">
                                      {STATUS_LABELS[status]}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  onClick={() => void handleTransition(job)}
                                  disabled={transitioningId === job.id}
                                  className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-charcoal-900 shadow-sm disabled:opacity-60"
                                >
                                  {transitioningId === job.id ? "Guardando..." : "Aplicar estado"}
                                </button>
                              </div>
                            )}
                          </div>

                          <div>
                            <p className="mb-2 text-sm font-semibold text-white/80">Tracking</p>
                            <input
                              type="text"
                              placeholder="Opcional"
                              value={trackingByJob[job.id] ?? job.tracking_number ?? ""}
                              onChange={(event) =>
                                setTrackingByJob((prev) => ({
                                  ...prev,
                                  [job.id]: event.target.value,
                                }))
                              }
                              className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                            />
                          </div>

                          <div className="grid gap-2 text-xs text-white/50">
                            <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                              <span className="font-semibold text-white/70">Creado:</span> {compactDate(job.created_at)}
                            </div>
                            <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                              <span className="font-semibold text-white/70">Actualizado:</span> {compactDate(job.updated_at)}
                            </div>
                            <div className="rounded-xl bg-white/[0.04] px-3 py-2">
                              <span className="font-semibold text-white/70">Envío:</span>{" "}
                              {job.shipping_address
                                ? `${job.shipping_address.recipient_name}, ${job.shipping_address.city}, ${job.shipping_address.postal_code}`
                                : "No cargado"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </section>
      </div>
    </main>
  );
}
