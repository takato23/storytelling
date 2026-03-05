import type { SupabaseClient } from "@supabase/supabase-js";
import type { Currency, OrderFormat } from "@/lib/types";

const FALLBACK_DIGITAL_PRICE_ARS = 9990;
const FALLBACK_PRINT_PRICE_ARS = 29990;

function round2(value: number) {
  return Number(value.toFixed(2));
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

function normalizePostalCode(value: string | null | undefined): string {
  return normalizeText(value).replace(/\s+/g, "");
}

export interface StoryPricing {
  id: string;
  title: string;
  base_price_usd: number;
  base_price_ars: number | null;
  digital_price_ars: number | null;
  print_price_ars: number | null;
}

interface ShippingRateRuleRow {
  id: string;
  name: string | null;
  country_code: string;
  province: string | null;
  postal_code_prefix: string | null;
  fee_ars: number;
  eta_days: number | null;
  priority: number;
  is_default: boolean;
}

export interface ShippingAddressPricingInput {
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
}

export interface ShippingRateSelection {
  ruleId: string;
  feeArs: number;
  etaDays: number | null;
  matchedBy: "postal_code_prefix" | "province" | "default";
}

export async function getStoryPricing(
  adminClient: SupabaseClient,
  storyId: string,
): Promise<StoryPricing> {
  const { data, error } = await adminClient
    .from("stories")
    .select("id,title,base_price_usd,base_price_ars,digital_price_ars,print_price_ars,active")
    .eq("id", storyId)
    .eq("active", true)
    .maybeSingle();

  if (error || !data) {
    throw new Error(`Story not found: ${storyId}`);
  }

  return {
    id: String(data.id),
    title: String(data.title),
    base_price_usd: Number(data.base_price_usd),
    base_price_ars: data.base_price_ars === null ? null : Number(data.base_price_ars),
    digital_price_ars: data.digital_price_ars === null ? null : Number(data.digital_price_ars),
    print_price_ars: data.print_price_ars === null ? null : Number(data.print_price_ars),
  };
}

export async function getLatestFxUsdArs(
  adminClient: SupabaseClient,
): Promise<{ date: string; usd_to_ars: number }> {
  const { data, error } = await adminClient
    .from("fx_rates_daily")
    .select("date,usd_to_ars")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!error && data) {
    return {
      date: String(data.date),
      usd_to_ars: Number(data.usd_to_ars),
    };
  }

  const fallback = Number(process.env.DEFAULT_USD_TO_ARS);
  if (!Number.isFinite(fallback) || fallback <= 0) {
    throw new Error("No FX rate available for ARS. Load fx_rates_daily or set DEFAULT_USD_TO_ARS.");
  }

  return {
    date: new Date().toISOString().slice(0, 10),
    usd_to_ars: fallback,
  };
}

function resolveStoryBasePriceArs(story: StoryPricing, format: OrderFormat): number {
  if (format === "digital") {
    if (story.digital_price_ars && story.digital_price_ars > 0) return round2(story.digital_price_ars);
    if (story.base_price_ars && story.base_price_ars > 0) return round2(story.base_price_ars);
    if (story.base_price_usd > 0) return round2(story.base_price_usd * 1000);
    return FALLBACK_DIGITAL_PRICE_ARS;
  }

  if (story.print_price_ars && story.print_price_ars > 0) return round2(story.print_price_ars);
  if (story.base_price_ars && story.base_price_ars > 0) return round2(story.base_price_ars);
  if (story.base_price_usd > 0) return round2(story.base_price_usd * 1000);
  return FALLBACK_PRINT_PRICE_ARS;
}

function pickShippingRule(
  rules: ShippingRateRuleRow[],
  address: ShippingAddressPricingInput,
): ShippingRateSelection | null {
  const normalizedPostalCode = normalizePostalCode(address.postalCode);
  const normalizedState = normalizeText(address.state);
  const normalizedCity = normalizeText(address.city);

  const prefixMatch = rules.find((rule) => {
    const prefix = normalizePostalCode(rule.postal_code_prefix);
    if (!prefix) return false;
    return normalizedPostalCode.startsWith(prefix);
  });

  if (prefixMatch) {
    return {
      ruleId: prefixMatch.id,
      feeArs: Number(prefixMatch.fee_ars),
      etaDays: prefixMatch.eta_days === null ? null : Number(prefixMatch.eta_days),
      matchedBy: "postal_code_prefix",
    };
  }

  const provinceMatch = rules.find((rule) => {
    const province = normalizeText(rule.province);
    return province.length > 0 && (province === normalizedState || province === normalizedCity);
  });

  if (provinceMatch) {
    return {
      ruleId: provinceMatch.id,
      feeArs: Number(provinceMatch.fee_ars),
      etaDays: provinceMatch.eta_days === null ? null : Number(provinceMatch.eta_days),
      matchedBy: "province",
    };
  }

  const defaultRule = rules.find((rule) => rule.is_default);
  if (!defaultRule) return null;

  return {
    ruleId: defaultRule.id,
    feeArs: Number(defaultRule.fee_ars),
    etaDays: defaultRule.eta_days === null ? null : Number(defaultRule.eta_days),
    matchedBy: "default",
  };
}

export async function getShippingRateForAddress(
  adminClient: SupabaseClient,
  address: ShippingAddressPricingInput,
): Promise<ShippingRateSelection> {
  const countryCode = normalizeText(address.countryCode);
  const { data, error } = await adminClient
    .from("shipping_rate_rules")
    .select("id,name,country_code,province,postal_code_prefix,fee_ars,eta_days,priority,is_default")
    .eq("active", true)
    .eq("country_code", countryCode)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) {
    throw new Error("No shipping rate rules configured");
  }

  const rules: ShippingRateRuleRow[] = data.map((row) => ({
    id: String(row.id),
    name: row.name ? String(row.name) : null,
    country_code: String(row.country_code),
    province: row.province ? String(row.province) : null,
    postal_code_prefix: row.postal_code_prefix ? String(row.postal_code_prefix) : null,
    fee_ars: Number(row.fee_ars),
    eta_days: row.eta_days === null ? null : Number(row.eta_days),
    priority: Number(row.priority),
    is_default: Boolean(row.is_default),
  }));

  const selected = pickShippingRule(rules, address);
  if (!selected) {
    throw new Error("No shipping rule matched the provided address");
  }

  return selected;
}

export interface PricingInput {
  story: StoryPricing;
  format: OrderFormat;
  currency: Currency;
  fxRateUsdArs?: number;
  shippingFeeArs?: number;
  shippingRuleId?: string | null;
  shippingEtaDays?: number | null;
}

export interface PricingOutput {
  subtotal: number;
  shipping_fee: number;
  total: number;
  fx_rate_snapshot: number | null;
  shipping_rule_id: string | null;
  shipping_eta_days: number | null;
}

export function buildPricing(input: PricingInput): PricingOutput {
  const subtotalArs = resolveStoryBasePriceArs(input.story, input.format);
  const shippingArs = input.format === "print" ? round2(input.shippingFeeArs ?? 0) : 0;
  const totalArs = round2(subtotalArs + shippingArs);

  if (input.currency === "ARS") {
    return {
      subtotal: subtotalArs,
      shipping_fee: shippingArs,
      total: totalArs,
      fx_rate_snapshot: input.fxRateUsdArs ?? null,
      shipping_rule_id: input.shippingRuleId ?? null,
      shipping_eta_days: input.shippingEtaDays ?? null,
    };
  }

  if (!input.fxRateUsdArs || input.fxRateUsdArs <= 0) {
    throw new Error("Missing FX snapshot for USD pricing");
  }

  return {
    subtotal: round2(subtotalArs / input.fxRateUsdArs),
    shipping_fee: round2(shippingArs / input.fxRateUsdArs),
    total: round2(totalArs / input.fxRateUsdArs),
    fx_rate_snapshot: input.fxRateUsdArs,
    shipping_rule_id: input.shippingRuleId ?? null,
    shipping_eta_days: input.shippingEtaDays ?? null,
  };
}

export function toMinorUnits(value: number): number {
  return Math.round(value * 100);
}
