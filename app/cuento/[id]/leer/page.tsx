import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { BookOpen, Download, ArrowLeft } from "lucide-react";
import { getValentinDinoPersonalizedTitle, isValentinDinoStoryId } from "@/lib/books/valentin-dino-package";
import { rowsToStoryPages } from "@/lib/generated-pages";
import { resolveStorageUrlForClient } from "@/lib/storage";
import { hasSupabaseCredentials } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function ReadOrderStoryPage(props: PageProps) {
  const { id } = await props.params;

  if (!hasSupabaseCredentials()) {
    return (
      <main className="min-h-screen bg-[var(--play-surface)] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/25 bg-white/80 backdrop-blur-sm p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-serif text-[var(--play-text-main)]">Visor no disponible</h1>
          <p className="mt-2 text-[var(--play-text-muted)]">Configura Supabase para habilitar lectura por pedido.</p>
        </div>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/cuento/${id}/leer`)}`);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id,status,created_at")
    .eq("id", id)
    .maybeSingle();

  if (orderError || !order) {
    notFound();
  }

  const allowedStatuses = new Set([
    "ready_digital",
    "qa_pending",
    "ready_print_assets",
    "qa_failed",
    "print_queued",
    "in_production",
    "packed",
    "shipped",
    "delivered",
  ]);
  if (!allowedStatuses.has(String(order.status))) {
    return (
      <main className="min-h-screen bg-[var(--play-surface)] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[var(--play-radius-panel)] border border-[var(--play-secondary-container)]/30 bg-[var(--play-secondary-container)]/10 p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-serif text-[var(--play-text-main)]">Tu historia aún se está preparando</h1>
          <p className="mt-2 text-[var(--play-text-muted)]">
            Estado actual: <strong>{String(order.status)}</strong>. Vuelve a intentar en unos minutos.
          </p>
          <Link href="/cuenta/pedidos" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--play-primary)] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a mis pedidos
          </Link>
        </div>
      </main>
    );
  }

  const [{ data: item }, { data: personalization }, { data: generatedRows }] = await Promise.all([
    supabase.from("order_items").select("story_id").eq("order_id", id).limit(1).maybeSingle(),
    supabase.from("personalizations").select("child_profile,personalization_payload").eq("order_id", id).maybeSingle(),
    supabase
      .from("generated_pages")
      .select("page_number,prompt_used,image_url,status")
      .eq("order_id", id)
      .order("page_number", { ascending: true }),
  ]);

  const { data: story } = item
    ? await supabase.from("stories").select("title").eq("id", String(item.story_id)).maybeSingle()
    : { data: null };

  const childProfile = personalization?.child_profile as Record<string, unknown> | null;
  const childName = String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero");
  const storyTitle = isValentinDinoStoryId(item?.story_id ? String(item.story_id) : null)
    ? getValentinDinoPersonalizedTitle(childName)
    : String(story?.title ?? "Historia personalizada");

  if (!generatedRows || generatedRows.length === 0) {
    return (
      <main className="min-h-screen bg-[var(--play-surface)] px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-[var(--play-radius-panel)] border border-[var(--play-secondary-container)]/30 bg-[var(--play-secondary-container)]/10 p-6 shadow-[var(--shadow-soft)]">
          <h1 className="text-2xl font-serif text-[var(--play-text-main)]">Tu historia aún se está preparando</h1>
          <p className="mt-2 text-[var(--play-text-muted)]">
            Estamos terminando de publicar los archivos finales de tu pedido. Intentá nuevamente en unos minutos.
          </p>
          <Link href="/cuenta/pedidos" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--play-primary)] hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver a mis pedidos
          </Link>
        </div>
      </main>
    );
  }

  const resolvedRows = await Promise.all(
    (generatedRows ?? []).map(async (row) => ({
      ...row,
      image_url: await resolveStorageUrlForClient(supabase, row.image_url ? String(row.image_url) : null),
    })),
  );
  const pages = rowsToStoryPages(resolvedRows);

  return (
    <main className="min-h-screen bg-[var(--play-surface)] px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/20 bg-white/80 backdrop-blur-sm p-6 shadow-[var(--shadow-soft)]">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--play-primary)] text-white shadow-md shadow-[var(--play-primary)]/20">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-serif text-[var(--play-text-main)]">{storyTitle}</h1>
              <p className="mt-2 text-[var(--play-text-muted)]">
                Protagonista: <strong className="text-[var(--play-text-main)]">{childName}</strong> · Pedido #{String(order.id).slice(0, 8)}
              </p>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/cuenta/pedidos" className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--play-surface-low)] px-4 py-2 text-sm font-semibold text-[var(--play-primary)] transition-colors hover:bg-[var(--play-surface-high)]">
              <ArrowLeft className="h-3.5 w-3.5" />
              Mis pedidos
            </Link>
            <a
              href={`/api/orders/${id}/digital-pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--play-accent-success)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar PDF
            </a>
          </div>
        </header>

        {pages.map((page) => (
          <article key={page.pageNumber} className="rounded-[var(--play-radius-panel)] border border-[var(--play-outline)]/20 bg-white/80 backdrop-blur-sm p-6 shadow-[var(--shadow-soft)]">
            <p className="text-xs uppercase tracking-[0.16em] font-bold text-[var(--play-primary)]">Página {page.pageNumber}</p>
            {page.layoutVariant === "standard" && (
              <h2 className="mt-2 text-2xl font-serif text-[var(--play-text-main)]">{page.title}</h2>
            )}
            {page.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--play-outline)]/15 shadow-sm">
                <img src={page.imageUrl} alt={page.title} className="h-72 w-full object-cover sm:h-96" />
              </div>
            )}
            {page.layoutVariant === "standard" && (
              <p className="mt-4 text-base leading-8 text-[var(--play-text-muted)]">{page.text}</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
