import { useQuery } from "@tanstack/react-query";
import type { PlanInfo } from "@whisper/api";
import { apiClient } from "~/lib/api-client";

export const PLANS_QUERY_KEY = ["billing", "plans"] as const;

export function usePlans() {
  return useQuery<PlanInfo[]>({
    queryKey: PLANS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.billing.plans.$get();
      if (!res.ok) {
        throw new Error(`Failed to fetch plans (${res.status})`);
      }
      return res.json() as Promise<PlanInfo[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
