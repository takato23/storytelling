import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buildPersonalizedStory } from "@/lib/digital-story";
import { rowsToStoryPages } from "@/lib/generated-pages";
import { hasSupabaseCredentials } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function ReadOrderStoryPage(props: PageProps) {
  const { id } = await props.params;

  if (!hasSupabaseCredentials()) {
    return (
      <main className="min-h-screen bg-cream-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-charcoal-100 bg-white p-6">
          <h1 className="text-2xl font-serif text-charcoal-900">Visor no disponible</h1>
          <p className="mt-2 text-charcoal-600">Configura Supabase para habilitar lectura por pedido.</p>
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

  const allowedStatuses = new Set(["ready_digital", "print_queued", "in_production", "packed", "shipped", "delivered"]);
  if (!allowedStatuses.has(String(order.status))) {
    return (
      <main className="min-h-screen bg-cream-50 px-4 py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-amber-100 bg-amber-50 p-6">
          <h1 className="text-2xl font-serif text-amber-900">Tu historia aún se está preparando</h1>
          <p className="mt-2 text-amber-800">
            Estado actual: <strong>{String(order.status)}</strong>. Vuelve a intentar en unos minutos.
          </p>
          <Link href="/cuenta/pedidos" className="mt-4 inline-block text-sm font-semibold text-amber-900 underline">
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
      .select("page_number,prompt_used,image_url")
      .eq("order_id", id)
      .order("page_number", { ascending: true }),
  ]);

  const { data: story } = item
    ? await supabase.from("stories").select("title").eq("id", String(item.story_id)).maybeSingle()
    : { data: null };

  const childProfile = personalization?.child_profile as Record<string, unknown> | null;
  const payload = personalization?.personalization_payload as Record<string, unknown> | null;

  const childName = String(childProfile?.name ?? childProfile?.child_name ?? "Peque aventurero");
  const readingLevel = typeof payload?.reading_level === "string" ? payload.reading_level : null;
  const familyMembers = Array.isArray(payload?.family_members)
    ? (payload?.family_members as Array<{ name?: string }>)
    : [];
  const storyTitle = String(story?.title ?? "Historia personalizada");

  const pages =
    generatedRows && generatedRows.length > 0
      ? rowsToStoryPages(generatedRows)
      : buildPersonalizedStory({
          childName,
          storyTitle,
          readingLevel,
          familyMembers,
        });

  return (
    <main className="min-h-screen bg-cream-50 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl border border-charcoal-100 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-serif text-charcoal-900">{storyTitle}</h1>
          <p className="mt-2 text-charcoal-600">
            Protagonista: <strong>{childName}</strong> · Pedido #{String(order.id).slice(0, 8)}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/cuenta/pedidos" className="text-sm font-semibold text-indigo-700 hover:underline">
              Volver a mis pedidos
            </Link>
            <a
              href={`/api/orders/${id}/digital-pdf`}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-emerald-700 hover:underline"
            >
              Descargar PDF
            </a>
          </div>
        </header>

        {pages.map((page) => (
          <article key={page.pageNumber} className="rounded-3xl border border-charcoal-100 bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-wide text-charcoal-500">Página {page.pageNumber}</p>
            <h2 className="mt-2 text-2xl font-serif text-charcoal-900">{page.title}</h2>
            {page.imageUrl && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-charcoal-100">
                <img src={page.imageUrl} alt={page.title} className="h-72 w-full object-cover" />
              </div>
            )}
            <p className="mt-3 text-base leading-8 text-charcoal-700">{page.text}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
