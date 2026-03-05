import { NextResponse } from "next/server";

type LogLevel = "info" | "error";

interface LogContext {
  request_id: string;
  route: string;
  user_id?: string;
  order_id?: string;
}

function nowIso() {
  return new Date().toISOString();
}

export function getRequestId(request: Request): string {
  const fromHeader = request.headers.get("x-request-id");
  if (fromHeader && fromHeader.trim().length > 0) {
    return fromHeader.slice(0, 128);
  }

  return crypto.randomUUID();
}

export function setRequestIdHeader(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

export function logEvent(
  level: LogLevel,
  event: string,
  context: LogContext,
  payload: Record<string, unknown> = {},
) {
  const body = {
    ts: nowIso(),
    level,
    event,
    ...context,
    ...payload,
  };

  const line = JSON.stringify(body);
  if (level === "error") {
    console.error(line);
    return;
  }

  console.log(line);
}
