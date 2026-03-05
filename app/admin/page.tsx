import Link from "next/link";

export default function AdminHomePage() {
  return (
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-3xl font-serif text-charcoal-900">Backoffice StoryMagic</h1>
        <p className="text-charcoal-600">
          Operación interna para MVP comercial: tipo de cambio diario y cola de impresión.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/admin/fx-rates"
            className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-charcoal-900">Tipo de Cambio (USD/ARS)</h2>
            <p className="mt-2 text-sm text-charcoal-600">Carga diaria para snapshot de cotización en checkout.</p>
          </Link>

          <Link
            href="/admin/print-jobs"
            className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-charcoal-900">Cola de Impresión</h2>
            <p className="mt-2 text-sm text-charcoal-600">Seguimiento manual de producción, packing y despacho.</p>
          </Link>

          <Link
            href="/admin/metrics"
            className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <h2 className="text-xl font-semibold text-charcoal-900">Métricas Operativas</h2>
            <p className="mt-2 text-sm text-charcoal-600">Conversión de checkout, pagos, generación digital y cola print.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
