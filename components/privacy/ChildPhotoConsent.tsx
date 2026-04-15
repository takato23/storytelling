"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Mandatory consent checkbox that must be ticked before a reference
 * photo of a child can be uploaded. Designed to be dropped into the
 * wizard step that receives the photo (see app/crear/page.tsx).
 *
 * Usage:
 *   <ChildPhotoConsent onChange={setConsent} />
 *   <button disabled={!consent}>Continuar</button>
 *
 * The consent text lives inline in this component so translations or
 * policy revisions are reflected immediately. The privacy policy is
 * linked at /privacidad (route to be created) and the canonical source
 * of truth is docs/privacy/POLICY.md.
 */

interface ChildPhotoConsentProps {
  onChange: (accepted: boolean) => void;
  defaultChecked?: boolean;
  className?: string;
}

export const CHILD_PHOTO_CONSENT_VERSION = "2026-04-15";

export const CHILD_PHOTO_CONSENT_TEXT = [
  "Declaro ser madre, padre o tutor/a legal del niño o niña cuya foto subo,",
  "y autorizo a StoryMagic a usar esa foto únicamente para generar las ilustraciones",
  "del libro personalizado. La foto original se borra automáticamente a las 24 horas de",
  "entregado el pedido y no se usa para entrenar modelos de IA.",
].join(" ");

export function ChildPhotoConsent({ onChange, defaultChecked = false, className }: ChildPhotoConsentProps) {
  const [checked, setChecked] = useState(defaultChecked);

  const handleChange = (next: boolean) => {
    setChecked(next);
    onChange(next);
  };

  return (
    <label
      className={
        className ??
        "flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-800"
      }
    >
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0"
        checked={checked}
        onChange={(event) => handleChange(event.target.checked)}
        aria-describedby="child-photo-consent-text"
        required
      />
      <span id="child-photo-consent-text">
        {CHILD_PHOTO_CONSENT_TEXT}{" "}
        <Link href="/privacidad" className="underline underline-offset-2">
          Leer política de privacidad
        </Link>
      </span>
    </label>
  );
}

/**
 * Returns what the API expects in the `consent` field. Keep this in sync
 * with the zod schema in app/api/personalize/route.ts.
 */
export function buildConsentPayload(accepted: boolean) {
  if (!accepted) return null;
  return {
    accepted: true,
    version: CHILD_PHOTO_CONSENT_VERSION,
    text: CHILD_PHOTO_CONSENT_TEXT,
  };
}
