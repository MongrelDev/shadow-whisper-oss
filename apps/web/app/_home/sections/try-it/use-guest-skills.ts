"use client";

import { useQuery } from "@tanstack/react-query";
import type { GuestSkillsResponse } from "@whisper/api";

import { guestApiClient } from "./guest-api";

export type GuestTransformer = GuestSkillsResponse["transformers"][number];

export type GuestSkillsData = GuestSkillsResponse;

interface GuestSkillsState {
  data: GuestSkillsData | null;
  loading: boolean;
  error: string | null;
}

async function fetchSkills(): Promise<GuestSkillsData> {
  const response = await guestApiClient.api.guest.skills.$get(undefined, {
    init: { credentials: "omit" },
  });
  if (!response.ok) throw new Error(`skills_fetch_failed_${response.status}`);
  return response.json();
}

export function useGuestSkills(): GuestSkillsState {
  const query = useQuery<GuestSkillsData, Error>({
    queryKey: ["guest", "skills"],
    queryFn: fetchSkills,
    staleTime: 5 * 60_000,
  });
  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error?.message ?? null,
  };
}
