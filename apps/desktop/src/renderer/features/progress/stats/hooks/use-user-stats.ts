import { useQuery } from "@tanstack/react-query";
import { ipcCall } from "~/lib/ipc";
import type { UserStatsView } from "../types";

export const USAGE_STATS_QUERY_KEY = ["usage", "stats"] as const;

export function useUserStats() {
  return useQuery<UserStatsView>({
    queryKey: USAGE_STATS_QUERY_KEY,
    queryFn: () => ipcCall(() => window.api.usage.getStats(), "Failed to load stats"),
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000,
  });
}
