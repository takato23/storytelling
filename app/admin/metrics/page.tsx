"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface MetricResponse {
  window_days: number;
  metrics: {
    checkout_start_to_paid_rate: { value_pct: number; numerator: number; denominator: number };
    payment_failure_rate: { value_pct: number; numerator: number; denominator: number };
    generation_success_rate: { value_pct: number; numerator: number; denominator: number };
    digital_ready_latency_minutes: { avg: number | null; samples: number };
    print_queue_age_hours: { max: number; queued_jobs: number };
  };
}

export default function AdminMetricsPage() {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MetricResponse | null>(null);

  async function loadMetrics(windowDays = days) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/metrics?days=${windowDays}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron cargar métricas.");
      }
      setData(payload as MetricResponse);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No se pudieron cargar métricas.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif text-charcoal-900">Métricas MVP</h1>
          <Link href="/admin" className="text-sm font-semibold text-indigo-700 hover:underline">
            Volver al backoffice
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-charcoal-100 bg-white p-4">
          <label htmlFor="window-days" className="text-sm font-medium text-charcoal-700">
            Ventana:
          </label>
          <select
            id="window-days"
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
            className="rounded-lg border border-charcoal-200 px-3 py-2 text-sm"
          >
            <option value={3}>3 días</option>
            <option value={7}>7 días</option>
            <option value={14}>14 días</option>
            <option value={30}>30 días</option>
          </select>
          <button
            onClick={() => void loadMetrics(days)}
            className="rounded-lg bg-indigo-950 px-4 py-2 text-sm font-semibold text-white"
          >
            Actualizar
          </button>
        </div>

        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        {loading ? (
          <p className="rounded-xl border border-charcoal-100 bg-white p-6 text-sm text-charcoal-500">Cargando métricas...</p>
        ) : data ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <article className="rounded-xl border border-charcoal-100 bg-white p-5">
              <p className="text-xs uppercase text-charcoal-500">Checkout → Paid</p>
              <p className="mt-2 text-3xl font-bold text-charcoal-900">{data.metrics.checkout_start_to_paid_rate.value_pct}%</p>
              <p className="mt-1 text-xs text-charcoal-500">
                {data.metrics.checkout_start_to_paid_rate.numerator}/{data.metrics.checkout_start_to_paid_rate.denominator}
              </p>
            </article>

            <article className="rounded-xl border border-charcoal-100 bg-white p-5">
              <p className="text-xs uppercase text-charcoal-500">Payment Failure Rate</p>
              <p className="mt-2 text-3xl font-bold text-charcoal-900">{data.metrics.payment_failure_rate.value_pct}%</p>
              <p className="mt-1 text-xs text-charcoal-500">
                {data.metrics.payment_failure_rate.numerator}/{data.metrics.payment_failure_rate.denominator}
              </p>
            </article>

            <article className="rounded-xl border border-charcoal-100 bg-white p-5">
              <p className="text-xs uppercase text-charcoal-500">Generation Success</p>
              <p className="mt-2 text-3xl font-bold text-charcoal-900">{data.metrics.generation_success_rate.value_pct}%</p>
              <p className="mt-1 text-xs text-charcoal-500">
                {data.metrics.generation_success_rate.numerator}/{data.metrics.generation_success_rate.denominator}
              </p>
            </article>

            <article className="rounded-xl border border-charcoal-100 bg-white p-5">
              <p className="text-xs uppercase text-charcoal-500">Digital Ready Latency</p>
              <p className="mt-2 text-3xl font-bold text-charcoal-900">
                {data.metrics.digital_ready_latency_minutes.avg === null
                  ? "N/D"
                  : `${data.metrics.digital_ready_latency_minutes.avg}m`}
              </p>
              <p className="mt-1 text-xs text-charcoal-500">{data.metrics.digital_ready_latency_minutes.samples} muestras</p>
            </article>

            <article className="rounded-xl border border-charcoal-100 bg-white p-5">
              <p className="text-xs uppercase text-charcoal-500">Print Queue Age (max)</p>
              <p className="mt-2 text-3xl font-bold text-charcoal-900">{data.metrics.print_queue_age_hours.max}h</p>
              <p className="mt-1 text-xs text-charcoal-500">{data.metrics.print_queue_age_hours.queued_jobs} en cola</p>
            </article>
          </div>
        ) : null}
      </div>
    </main>
  );
}
