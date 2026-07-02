"use client";

import { useQuery } from "@tanstack/react-query";
import type { GuestWarmupResponse } from "@whisper/api";

import { guestApiClient } from "./guest-api";

async function fetchWarmup(): Promise<GuestWarmupResponse> {
  const res = await guestApiClient.api.guest.warmup.$post(undefined, {
    init: { credentials: "include" },
  });
  if (!res.ok) throw new Error(`warmup_failed_${res.status}`);
  return (await res.json()) as GuestWarmupResponse;
}

interface GuestWarmupState {
  ready: boolean;
  sessionId: string | null;
  loading: boolean;
  error: string | null;
}

export function useGuestWarmup(): GuestWarmupState {
  const query = useQuery<GuestWarmupResponse, Error>({
    queryKey: ["guest", "warmup"],
    queryFn: fetchWarmup,
    staleTime: 60 * 60_000,
  });
  return {
    ready: query.isSuccess,
    sessionId: query.data?.sessionId ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
