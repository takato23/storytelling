"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-serif text-charcoal-900">FX Diario USD/ARS</h1>
          <Link href="/admin" className="text-sm font-semibold text-indigo-700 hover:underline">
            Volver al backoffice
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-charcoal-100 bg-white p-5 md:grid-cols-4">
          <div className="md:col-span-1">
            <label htmlFor="fx-date" className="mb-1 block text-xs font-semibold uppercase text-charcoal-500">
              Fecha
            </label>
            <input
              id="fx-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="w-full rounded-lg border border-charcoal-200 px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="fx-rate" className="mb-1 block text-xs font-semibold uppercase text-charcoal-500">
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
              onChange={(event) => setRate(event.target.value)}
              required
              className="w-full rounded-lg border border-charcoal-200 px-3 py-2"
            />
          </div>
          <div className="md:col-span-1 md:self-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-950 px-4 py-2 font-semibold text-white disabled:opacity-60"
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>

        {error && <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {success && (
          <p className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p>
        )}

        <section className="rounded-2xl border border-charcoal-100 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-charcoal-900">Últimas cotizaciones</h2>
          {fetching ? (
            <p className="text-sm text-charcoal-500">Cargando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-charcoal-500">Sin registros cargados.</p>
          ) : (
            <div className="overflow-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-charcoal-100 text-left text-charcoal-500">
                    <th className="py-2 pr-3 font-medium">Fecha</th>
                    <th className="py-2 pr-3 font-medium">USD/ARS</th>
                    <th className="py-2 pr-3 font-medium">Actualizado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.date} className="border-b border-charcoal-50 text-charcoal-800">
                      <td className="py-2 pr-3">{row.date}</td>
                      <td className="py-2 pr-3">{Number(row.usd_to_ars).toLocaleString("es-AR")}</td>
                      <td className="py-2 pr-3">{new Date(row.created_at).toLocaleString("es-AR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
