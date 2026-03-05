"use client";

import { analyticsCapture } from "@/lib/analytics/client";
import type {
  AnalyticsEventName,
  AnalyticsEventProps,
} from "@/lib/analytics/types";

export function captureEvent<T extends AnalyticsEventName>(
  event: T,
  properties: AnalyticsEventProps<T>,
) {
  analyticsCapture(event, properties as Record<string, unknown>);
}
