import { NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase";

const PAID_OR_AFTER_STATUSES = new Set([
  "paid",
  "generating",
  "ready_digital",
  "print_queued",
  "in_production",
  "packed",
  "shipped",
  "delivered",
  "refunded",
]);

const CHECKOUT_STARTED_STATUSES = new Set([
  "pending_payment",
  "paid",
  "generating",
  "ready_digital",
  "print_queued",
  "in_production",
  "packed",
  "shipped",
  "delivered",
  "failed",
  "cancelled",
  "refunded",
]);

function safePct(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function avg(values: number[]) {
  if (values.length === 0) return null;
  return Number((values.reduce((acc, value) => acc + value, 0) / values.length).toFixed(2));
}

export async function GET(request: Request) {
  try {
    await requireAdminUser();
    const adminClient = createSupabaseAdminClient();
    const { searchParams } = new URL(request.url);
    const days = Math.min(Math.max(Number(searchParams.get("days") ?? "7"), 1), 30);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const [
      { data: orders, error: ordersError },
      { data: payments, error: paymentsError },
      { data: generationJobs, error: generationJobsError },
      { data: printJobs, error: printJobsError },
      { data: orderEvents, error: orderEventsError },
    ] = await Promise.all([
      adminClient.from("orders").select("id,status,created_at").gte("created_at", since),
      adminClient.from("payments").select("status,created_at").gte("created_at", since),
      adminClient.from("generation_jobs").select("status,created_at,started_at,completed_at").gte("created_at", since),
      adminClient.from("print_jobs").select("status,created_at,updated_at"),
      adminClient
        .from("order_events")
        .select("order_id,event_type,created_at")
        .in("event_type", ["payment_completed", "digital_ready"])
        .gte("created_at", since),
    ]);

    if (ordersError || paymentsError || generationJobsError || printJobsError || orderEventsError) {
      throw new Error(
        ordersError?.message ||
          paymentsError?.message ||
          generationJobsError?.message ||
          printJobsError?.message ||
          orderEventsError?.message ||
          "Failed to load metrics",
      );
    }

    const checkoutStarts = (orders ?? []).filter((order) => CHECKOUT_STARTED_STATUSES.has(String(order.status))).length;
    const paidOrders = (orders ?? []).filter((order) => PAID_OR_AFTER_STATUSES.has(String(order.status))).length;
    const checkoutStartToPaidRate = safePct(paidOrders, checkoutStarts);

    const paymentAttempts = (payments ?? []).length;
    const paymentFailures = (payments ?? []).filter((payment) => String(payment.status) === "failed").length;
    const paymentFailureRate = safePct(paymentFailures, paymentAttempts);

    const finishedGenerationJobs = (generationJobs ?? []).filter((job) =>
      ["completed", "failed", "cancelled"].includes(String(job.status)),
    );
    const generationSuccesses = finishedGenerationJobs.filter((job) => String(job.status) === "completed").length;
    const generationSuccessRate = safePct(generationSuccesses, finishedGenerationJobs.length);

    const paymentCompletedAtByOrder = new Map<string, number>();
    const digitalReadyAtByOrder = new Map<string, number>();

    for (const event of orderEvents ?? []) {
      const orderId = String(event.order_id);
      const timestamp = new Date(String(event.created_at)).getTime();
      if (String(event.event_type) === "payment_completed") {
        const existing = paymentCompletedAtByOrder.get(orderId);
        if (!existing || timestamp < existing) {
          paymentCompletedAtByOrder.set(orderId, timestamp);
        }
      }
      if (String(event.event_type) === "digital_ready") {
        const existing = digitalReadyAtByOrder.get(orderId);
        if (!existing || timestamp < existing) {
          digitalReadyAtByOrder.set(orderId, timestamp);
        }
      }
    }

    const digitalReadyLatenciesMinutes: number[] = [];
    for (const [orderId, paymentTimestamp] of paymentCompletedAtByOrder.entries()) {
      const digitalReadyTimestamp = digitalReadyAtByOrder.get(orderId);
      if (!digitalReadyTimestamp || digitalReadyTimestamp < paymentTimestamp) continue;
      digitalReadyLatenciesMinutes.push((digitalReadyTimestamp - paymentTimestamp) / (1000 * 60));
    }

    const digitalReadyLatencyMinutes = avg(digitalReadyLatenciesMinutes);

    const queuedPrintJobs = (printJobs ?? []).filter((job) => String(job.status) === "queued");
    const queueAgesHours = queuedPrintJobs.map((job) => (Date.now() - new Date(String(job.created_at)).getTime()) / (1000 * 60 * 60));
    const printQueueAgeHours = queueAgesHours.length === 0 ? 0 : Number(Math.max(...queueAgesHours).toFixed(2));

    return NextResponse.json({
      window_days: days,
      metrics: {
        checkout_start_to_paid_rate: {
          value_pct: checkoutStartToPaidRate,
          numerator: paidOrders,
          denominator: checkoutStarts,
        },
        payment_failure_rate: {
          value_pct: paymentFailureRate,
          numerator: paymentFailures,
          denominator: paymentAttempts,
        },
        generation_success_rate: {
          value_pct: generationSuccessRate,
          numerator: generationSuccesses,
          denominator: finishedGenerationJobs.length,
        },
        digital_ready_latency_minutes: {
          avg: digitalReadyLatencyMinutes,
          samples: digitalReadyLatenciesMinutes.length,
        },
        print_queue_age_hours: {
          max: printQueueAgeHours,
          queued_jobs: queuedPrintJobs.length,
        },
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
