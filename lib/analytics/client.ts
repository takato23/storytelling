"use client";

import posthog from "posthog-js";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

let initialized = false;

export function isAnalyticsEnabled() {
  return typeof window !== "undefined" && Boolean(POSTHOG_KEY);
}

export function initAnalytics() {
  if (!isAnalyticsEnabled() || initialized || !POSTHOG_KEY) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    capture_pageleave: true,
  });

  initialized = true;
}

export function analyticsCapture(event: string, properties?: Record<string, unknown>) {
  if (!isAnalyticsEnabled()) return;
  initAnalytics();
  posthog.capture(event, properties);
}
