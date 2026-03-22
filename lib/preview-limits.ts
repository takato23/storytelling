import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ApiError } from "@/lib/auth";
import { getEnv } from "@/lib/config";

function stripDataUrlPrefix(base64: string) {
  return base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
}

function hashPreviewImage(base64: string | null | undefined) {
  if (!base64) return null;
  return crypto.createHash("sha256").update(stripDataUrlPrefix(base64)).digest("hex");
}

async function ensureProfileExists(adminClient: SupabaseClient, userId: string) {
  const { error } = await adminClient.from("profiles").upsert({ id: userId }, { onConflict: "id" });

  if (error) {
    throw new Error(error.message);
  }
}

export async function reservePreviewCredit(
  adminClient: SupabaseClient,
  params: {
    userId: string;
    storyId: string;
    imageBase64?: string | null;
  },
) {
  await ensureProfileExists(adminClient, params.userId);

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("free_preview_credits,free_preview_used")
    .eq("id", params.userId)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const env = getEnv();
  if (env.previewsDisabled) {
    throw new ApiError(
      503,
      "preview_temporarily_disabled",
      "La vista previa gratuita está pausada por el momento. Podés continuar con la compra y generar el libro final después del pago.",
    );
  }

  const credits = Math.max(0, Number(profile?.free_preview_credits ?? env.freePreviewCreditsDefault));
  const used = Math.max(0, Number(profile?.free_preview_used ?? 0));

  if (used >= credits) {
    throw new ApiError(
      403,
      "preview_limit_reached",
      "Ya usaste tus previews gratis. Si querés seguir, podés avanzar con la compra y generar el libro final después del pago.",
    );
  }

  const nextUsed = used + 1;
  const { data: updatedProfile, error: updateError } = await adminClient
    .from("profiles")
    .update({ free_preview_used: nextUsed })
    .eq("id", params.userId)
    .eq("free_preview_used", used)
    .select("id")
    .maybeSingle();

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (!updatedProfile) {
    throw new Error("Could not reserve preview credit. Please try again.");
  }

  const { data: usageRow, error: usageError } = await adminClient
    .from("preview_generation_usage")
    .insert({
      user_id: params.userId,
      story_id: params.storyId,
      image_hash: hashPreviewImage(params.imageBase64 ?? null),
      status: "started",
    })
    .select("id")
    .single();

  if (usageError || !usageRow) {
    throw new Error(usageError?.message ?? "Failed to create preview usage record");
  }

  return {
    usageId: String(usageRow.id),
    remainingCredits: Math.max(credits - nextUsed, 0),
  };
}

export async function finalizePreviewGeneration(
  adminClient: SupabaseClient,
  params: {
    usageId: string;
    status: "succeeded" | "failed";
    provider?: string | null;
    model?: string | null;
    errorMessage?: string | null;
  },
) {
  const { error } = await adminClient
    .from("preview_generation_usage")
    .update({
      status: params.status,
      provider: params.provider ?? null,
      model: params.model ?? null,
      error_message: params.errorMessage ?? null,
    })
    .eq("id", params.usageId);

  if (error) {
    throw new Error(error.message);
  }
}
