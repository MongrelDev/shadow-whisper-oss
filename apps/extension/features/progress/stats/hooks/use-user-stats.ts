import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/lib/api-client";
import type { UserStatsView } from "../types";

export const USAGE_STATS_QUERY_KEY = ["usage", "stats"] as const;

export function useUserStats() {
  return useQuery<UserStatsView>({
    queryKey: USAGE_STATS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.api.usage.stats.$get();
      if (!res.ok) throw new Error(`Failed to fetch user stats (${res.status})`);
      return (await res.json()) as UserStatsView;
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
