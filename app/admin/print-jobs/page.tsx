"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type PrintJobStatus = "queued" | "in_production" | "packed" | "shipped" | "delivered" | "failed" | "cancelled";

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
}

const TRANSITIONS: Record<PrintJobStatus, PrintJobStatus[]> = {
  queued: ["in_production", "failed", "cancelled"],
  in_production: ["packed", "failed", "cancelled"],
  packed: ["shipped", "failed", "cancelled"],
  shipped: ["delivered", "failed"],
  delivered: [],
  failed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<PrintJobStatus, string> = {
  queued: "En cola",
  in_production: "En producción",
  packed: "Empaquetado",
  shipped: "Despachado",
  delivered: "Entregado",
  failed: "Fallido",
  cancelled: "Cancelado",
};

export default function AdminPrintJobsPage() {
  const [jobs, setJobs] = useState<PrintJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [targetByJob, setTargetByJob] = useState<Record<string, PrintJobStatus>>({});
  const [trackingByJob, setTrackingByJob] = useState<Record<string, string>>({});

  const activeJobs = useMemo(
    () => jobs.filter((job) => !["delivered", "cancelled", "failed"].includes(job.status)),
    [jobs],
  );

  async function loadJobs() {
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
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No se pudo cargar la cola.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

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

  useEffect(() => {
    void loadJobs();
  }, []);

  return (
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif text-charcoal-900">Cola de Impresión</h1>
          <Link href="/admin" className="text-sm font-semibold text-indigo-700 hover:underline">
            Volver al backoffice
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-charcoal-100 bg-white p-4">
            <p className="text-sm text-charcoal-500">Jobs activos</p>
            <p className="text-2xl font-bold text-charcoal-900">{activeJobs.length}</p>
          </div>
          <div className="rounded-xl border border-charcoal-100 bg-white p-4">
            <p className="text-sm text-charcoal-500">Total jobs</p>
            <p className="text-2xl font-bold text-charcoal-900">{jobs.length}</p>
          </div>
          <button
            onClick={() => void loadJobs()}
            className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left text-indigo-800 transition hover:bg-indigo-100"
          >
            <p className="text-sm font-semibold">Refrescar cola</p>
            <p className="text-xs opacity-80">Actualizar estados desde backend</p>
          </button>
        </div>

        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <section className="rounded-2xl border border-charcoal-100 bg-white p-5">
          {loading ? (
            <p className="text-sm text-charcoal-500">Cargando jobs...</p>
          ) : jobs.length === 0 ? (
            <p className="text-sm text-charcoal-500">No hay trabajos de impresión en cola.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 text-left text-charcoal-500">
                    <th className="py-2 pr-3 font-medium">Job</th>
                    <th className="py-2 pr-3 font-medium">Orden</th>
                    <th className="py-2 pr-3 font-medium">Cuento</th>
                    <th className="py-2 pr-3 font-medium">Estado</th>
                    <th className="py-2 pr-3 font-medium">Tracking</th>
                    <th className="py-2 pr-3 font-medium">Transición</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => {
                    const allowed = TRANSITIONS[job.status];
                    return (
                      <tr key={job.id} className="border-b border-charcoal-50 align-top">
                        <td className="py-3 pr-3 text-charcoal-700">{job.id.slice(0, 8)}...</td>
                        <td className="py-3 pr-3">
                          <div className="font-medium text-charcoal-800">{job.order?.id.slice(0, 8)}...</div>
                          <div className="text-xs text-charcoal-500">{job.order?.currency} {job.order?.total?.toFixed(2)}</div>
                        </td>
                        <td className="py-3 pr-3 text-charcoal-800">{job.item?.story_title ?? "Cuento"}</td>
                        <td className="py-3 pr-3">
                          <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700">
                            {STATUS_LABELS[job.status]}
                          </span>
                        </td>
                        <td className="py-3 pr-3">
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
                            className="w-40 rounded-lg border border-charcoal-200 px-2 py-1 text-xs"
                          />
                        </td>
                        <td className="py-3 pr-3">
                          {allowed.length === 0 ? (
                            <span className="text-xs text-charcoal-500">Sin transición</span>
                          ) : (
                            <div className="flex gap-2">
                              <select
                                value={targetByJob[job.id] ?? allowed[0]}
                                onChange={(event) =>
                                  setTargetByJob((prev) => ({
                                    ...prev,
                                    [job.id]: event.target.value as PrintJobStatus,
                                  }))
                                }
                                className="rounded-lg border border-charcoal-200 px-2 py-1 text-xs"
                              >
                                {allowed.map((status) => (
                                  <option key={status} value={status}>
                                    {STATUS_LABELS[status]}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => void handleTransition(job)}
                                disabled={transitioningId === job.id}
                                className="rounded-lg bg-indigo-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                              >
                                {transitioningId === job.id ? "Guardando..." : "Aplicar"}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
