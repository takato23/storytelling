"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Calendar, Check, DollarSign, RefreshCcw, TrendingUp } from "lucide-react";

interface FxRateRow {
  date: string;
  usd_to_ars: number;
  created_at: string;
}

function todayLocalDate() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function AdminFxRatesPage() {
  const [date, setDate] = useState(todayLocalDate());
  const [rate, setRate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rows, setRows] = useState<FxRateRow[]>([]);
  const [fetching, setFetching] = useState(true);

  const parsedRate = useMemo(() => Number(rate), [rate]);

  async function loadRates() {
    setFetching(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/fx-rates?limit=45");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cargar la tabla FX.");
      }
      setRows((payload.fx_rates ?? []) as FxRateRow[]);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "No se pudo cargar FX.";
      setError(message);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
      setError("Ingresá un tipo de cambio válido mayor a 0.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/fx-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          usd_to_ars: parsedRate,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar la cotización.");
      }
      setSuccess(`FX guardado para ${date}: ${parsedRate.toLocaleString("es-AR")}`);
      setRate("");
      await loadRates();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "No se pudo guardar FX.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRates();
  }, []);

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Tipo de cambio</h1>
          <p className="mt-1 text-sm text-white/40">Cotización diaria USD/ARS para el checkout.</p>
        </div>
        <button
          onClick={() => void loadRates()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white/80"
        >
          <RefreshCcw className="h-3.5 w-3.5" />
          Refrescar
        </button>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5 md:grid-cols-[1fr_1.5fr_auto]"
      >
        <div>
          <label htmlFor="fx-date" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            <Calendar className="h-3 w-3" />
            Fecha
          </label>
          <input
            id="fx-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div>
          <label htmlFor="fx-rate" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/40">
            <ArrowUpDown className="h-3 w-3" />
            USD a ARS
          </label>
          <input
            id="fx-rate"
            type="number"
            inputMode="decimal"
            min="0.0001"
            step="0.0001"
            placeholder="Ej: 1250.50"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            required
            className="w-full rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          />
        </div>
        <div className="self-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-charcoal-900 shadow-md shadow-black/20 transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {error}
        </p>
      )}
      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <Check className="h-4 w-4" />
          {success}
        </div>
      )}

      {/* History table */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-semibold text-white/70">Últimas cotizaciones</h2>
        </div>

        {fetching ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/30">Sin registros cargados.</p>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] text-left">
                  <th className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Fecha</th>
                  <th className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-[0.1em] text-white/35">USD/ARS</th>
                  <th className="py-2.5 pr-4 text-xs font-semibold uppercase tracking-[0.1em] text-white/35">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.date}
                    className={`border-b border-white/[0.03] text-white/70 transition hover:bg-white/[0.03] ${i === 0 ? "text-white font-medium" : ""}`}
                  >
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {i === 0 && <DollarSign className="h-3.5 w-3.5 text-emerald-400" />}
                        {row.date}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{Number(row.usd_to_ars).toLocaleString("es-AR")}</td>
                    <td className="py-2.5 pr-4 text-white/40">{new Date(row.created_at).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
