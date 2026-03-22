import { getSupabaseConfig } from "@/lib/config";

export interface SupabaseCredentials {
  url: string;
  anonKey: string;
}

export function hasSupabaseCredentials(): boolean {
  try {
    const { url, anonKey } = getSupabaseConfig();
    return Boolean(url && anonKey);
  } catch {
    return false;
  }
}

export function getSupabaseCredentials(): SupabaseCredentials {
  const { url, anonKey } = getSupabaseConfig();
  return { url, anonKey };
}
