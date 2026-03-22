import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "@/lib/auth";
import { isProduction } from "@/lib/config";

export function validationErrorResponse(error: ZodError) {
  return NextResponse.json(
    {
      error: "invalid_request",
      message: "Request payload validation failed",
      details: error.flatten(),
    },
    { status: 400 },
  );
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: error.code,
        message: error.message,
      },
      { status: error.status },
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: "internal_error",
        message: isProduction() ? "Internal server error" : error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      error: "internal_error",
      message: "Unexpected server error",
    },
    { status: 500 },
  );
}
