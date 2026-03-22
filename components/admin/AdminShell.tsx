"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  DollarSign,
  LayoutDashboard,
  Printer,
} from "lucide-react";

const ADMIN_LINKS = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard },
  { href: "/admin/print-jobs", label: "Pedidos físicos", icon: Printer },
  { href: "/admin/metrics", label: "Métricas", icon: BarChart3 },
  { href: "/admin/fx-rates", label: "Tipo de cambio", icon: DollarSign },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(30,27,46,0.97),rgba(24,22,38,1)_48%,rgba(18,16,30,1)_100%)]">
      {/* --- Sticky header --- */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[rgba(24,22,38,0.82)] backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3.5 md:px-6">
          {/* Top row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
                <span className="text-sm font-bold text-white">S</span>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400/80">
                  StoryMagic
                </p>
                <h1 className="text-sm font-semibold text-white/90">Panel de operaciones</h1>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3.5 py-2 text-xs font-semibold text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white/90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver al sitio
            </Link>
          </div>

          {/* Nav pills */}
          <nav className="flex gap-1.5 overflow-x-auto pb-0.5">
            {ADMIN_LINKS.map((link) => {
              const active = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition ${
                    active
                      ? "bg-white text-charcoal-900 shadow-md shadow-black/20"
                      : "text-white/50 hover:bg-white/[0.06] hover:text-white/80"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* --- Content --- */}
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">{children}</div>
    </div>
  );
}
