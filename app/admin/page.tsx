import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  DollarSign,
  FileCheck,
  Package,
  Printer,
  Sparkles,
  Truck,
  Wand2,
} from "lucide-react";

const NAV_CARDS = [
  {
    href: "/admin/print-jobs",
    icon: Printer,
    title: "Pedidos físicos",
    description: "Revisá, regenerá y aprobá libros antes de enviarlos a imprenta.",
    gradient: "from-violet-500/20 to-purple-600/20",
    iconBg: "bg-violet-500/15",
    iconColor: "text-violet-400",
    ring: "ring-violet-500/20",
  },
  {
    href: "/admin/metrics",
    icon: BarChart3,
    title: "Métricas",
    description: "Conversión de checkout, volumen de previews, costos de IA y salud del pipeline.",
    gradient: "from-sky-500/20 to-cyan-600/20",
    iconBg: "bg-sky-500/15",
    iconColor: "text-sky-400",
    ring: "ring-sky-500/20",
  },
  {
    href: "/admin/fx-rates",
    icon: DollarSign,
    title: "Tipo de cambio",
    description: "Cargá la cotización diaria USD/ARS para que el checkout refleje el precio real.",
    gradient: "from-emerald-500/20 to-teal-600/20",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    ring: "ring-emerald-500/20",
  },
];

const WORKFLOW_STEPS = [
  {
    number: "01",
    icon: FileCheck,
    title: "Revisar pedidos",
    description: "Abrí «Pedidos físicos» y revisá las páginas generadas.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Regenerar si falla",
    description: "Reintentar automático o prompt manual con Gemini.",
  },
  {
    number: "03",
    icon: Package,
    title: "Descargar y aprobar",
    description: "Bajá el PDF/ZIP y marcá como aprobado.",
  },
  {
    number: "04",
    icon: Truck,
    title: "Producción y envío",
    description: "Pasá a producción, empaquetado y despacho con tracking.",
  },
];

export default function AdminHomePage() {
  return (
    <main className="space-y-8">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 md:p-8">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-violet-500/8 blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400">
              <Sparkles className="h-3 w-3" />
              Panel de operaciones
            </div>
            <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
              Bienvenida al backoffice
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              Todo lo que necesitás para operar el negocio: revisar pedidos, descargar archivos para imprenta, controlar métricas y actualizar la cotización. Simple, claro y sin cosas técnicas.
            </p>
          </div>

          <Link
            href="/admin/print-jobs"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-charcoal-900 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            <Printer className="h-4 w-4" />
            Ir a pedidos físicos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Navigation cards ── */}
      <section className="grid gap-4 md:grid-cols-3">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br ${card.gradient} p-5 ring-1 ${card.ring} transition hover:-translate-y-1 hover:border-white/10 hover:shadow-xl hover:shadow-black/20`}
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{card.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/45">{card.description}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-white/40 transition group-hover:text-white/70">
                Abrir
                <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          );
        })}
      </section>

      {/* ── Workflow ── */}
      <section className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-white/40" />
          <h3 className="text-sm font-semibold text-white/70">Flujo de trabajo recomendado</h3>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="rounded-xl border border-white/[0.04] bg-white/[0.03] p-4 transition hover:border-white/[0.08] hover:bg-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-indigo-400/60">{step.number}</span>
                  <Icon className="h-4 w-4 text-white/30" />
                </div>
                <p className="mt-3 text-sm font-semibold text-white/80">{step.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/35">{step.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
