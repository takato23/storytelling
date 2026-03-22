"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CreditCard,
  DollarSign,
  Eye,
  Gauge,
  RefreshCcw,
  Sparkles,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";

interface MetricResponse {
  window_days: number;
  settings: {
    previews_enabled: boolean;
  };
  metrics: {
    checkout_start_to_paid_rate: { value_pct: number; numerator: number; denominator: number };
    payment_failure_rate: { value_pct: number; numerator: number; denominator: number };
    generation_success_rate: { value_pct: number; numerator: number; denominator: number };
    digital_ready_latency_minutes: { avg: number | null; samples: number };
    print_queue_age_hours: { max: number; queued_jobs: number };
    preview_volume: { total: number; successful: number; failed: number; unique_users: number };
    preview_to_paid_rate: { value_pct: number; numerator: number; denominator: number };
    estimated_preview_cost_usd: { total: number; unit_cost: number };
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtitle,
  accentColor = "indigo",
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  subtitle: string;
  accentColor?: "indigo" | "emerald" | "amber" | "sky" | "violet" | "rose" | "teal";
}) {
  const colorMap: Record<string, { iconBg: string; iconText: string; ring: string }> = {
    indigo: { iconBg: "bg-indigo-500/15", iconText: "text-indigo-400", ring: "ring-indigo-500/10" },
    emerald: { iconBg: "bg-emerald-500/15", iconText: "text-emerald-400", ring: "ring-emerald-500/10" },
    amber: { iconBg: "bg-amber-500/15", iconText: "text-amber-400", ring: "ring-amber-500/10" },
    sky: { iconBg: "bg-sky-500/15", iconText: "text-sky-400", ring: "ring-sky-500/10" },
    violet: { iconBg: "bg-violet-500/15", iconText: "text-violet-400", ring: "ring-violet-500/10" },
    rose: { iconBg: "bg-rose-500/15", iconText: "text-rose-400", ring: "ring-rose-500/10" },
    teal: { iconBg: "bg-teal-500/15", iconText: "text-teal-400", ring: "ring-teal-500/10" },
  };
  const c = colorMap[accentColor] ?? colorMap.indigo;

  return (
    <article className={`rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 ring-1 ${c.ring}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${c.iconBg}`}>
          <Icon className={`h-4 w-4 ${c.iconText}`} />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      </div>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-white/35">{subtitle}</p>
    </article>
  );
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
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Métricas</h1>
          <p className="mt-1 text-sm text-white/40">Health dashboard del pipeline de generación y ventas.</p>
        </div>

        <div className="flex items-center gap-2">
          <select
            id="window-days"
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value={3} className="bg-charcoal-900">3 días</option>
            <option value={7} className="bg-charcoal-900">7 días</option>
            <option value={14} className="bg-charcoal-900">14 días</option>
            <option value={30} className="bg-charcoal-900">30 días</option>
          </select>
          <button
            onClick={() => void loadMetrics(days)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-charcoal-900 shadow-md shadow-black/20 transition hover:-translate-y-0.5"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Actualizar
          </button>
          {data && (
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                data.settings.previews_enabled
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                  : "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20"
              }`}
            >
              {data.settings.previews_enabled ? "Previews activas" : "Previews pausadas"}
            </span>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/[0.04] bg-white/[0.03]" />
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={CreditCard}
            label="Checkout → Paid"
            value={`${data.metrics.checkout_start_to_paid_rate.value_pct}%`}
            subtitle={`${data.metrics.checkout_start_to_paid_rate.numerator}/${data.metrics.checkout_start_to_paid_rate.denominator}`}
            accentColor="emerald"
          />
          <MetricCard
            icon={AlertTriangle}
            label="Payment Failure"
            value={`${data.metrics.payment_failure_rate.value_pct}%`}
            subtitle={`${data.metrics.payment_failure_rate.numerator}/${data.metrics.payment_failure_rate.denominator}`}
            accentColor="rose"
          />
          <MetricCard
            icon={Zap}
            label="Generación OK"
            value={`${data.metrics.generation_success_rate.value_pct}%`}
            subtitle={`${data.metrics.generation_success_rate.numerator}/${data.metrics.generation_success_rate.denominator}`}
            accentColor="violet"
          />
          <MetricCard
            icon={Timer}
            label="Latencia Digital"
            value={data.metrics.digital_ready_latency_minutes.avg === null ? "N/D" : `${data.metrics.digital_ready_latency_minutes.avg}m`}
            subtitle={`${data.metrics.digital_ready_latency_minutes.samples} muestras`}
            accentColor="sky"
          />
          <MetricCard
            icon={Gauge}
            label="Cola Imprenta (max)"
            value={`${data.metrics.print_queue_age_hours.max}h`}
            subtitle={`${data.metrics.print_queue_age_hours.queued_jobs} en cola`}
            accentColor="amber"
          />
          <MetricCard
            icon={Eye}
            label="Previews Gratis"
            value={`${data.metrics.preview_volume.total}`}
            subtitle={`${data.metrics.preview_volume.successful} ok · ${data.metrics.preview_volume.failed} fallidas · ${data.metrics.preview_volume.unique_users} usuarios`}
            accentColor="indigo"
          />
          <MetricCard
            icon={TrendingUp}
            label="Preview → Paid"
            value={`${data.metrics.preview_to_paid_rate.value_pct}%`}
            subtitle={`${data.metrics.preview_to_paid_rate.numerator}/${data.metrics.preview_to_paid_rate.denominator}`}
            accentColor="teal"
          />
          <MetricCard
            icon={DollarSign}
            label="Costo IA Preview"
            value={`USD ${data.metrics.estimated_preview_cost_usd.total}`}
            subtitle={`USD ${data.metrics.estimated_preview_cost_usd.unit_cost} por preview`}
            accentColor="emerald"
          />
        </div>
      ) : null}
    </main>
  );
}
