"use client";

import { createApiClient } from "@whisper/api/client";

export function workerBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_WORKER_URL ?? "").replace(/\/+$/, "");
}

export const guestApiClient = createApiClient(workerBaseUrl(), {});

export type GuestErrorKind = "rate_limit" | "payload_too_large" | "origin" | "generic";
