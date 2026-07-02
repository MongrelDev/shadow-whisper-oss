import { useQuery } from "@tanstack/react-query";
import type { SubscriptionStatus } from "@whisper/api";
import { apiClient } from "~/lib/api-client";

export const SUBSCRIPTION_STATUS_QUERY_KEY = ["billing", "subscriptionStatus"] as const;

export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus>({
    queryKey: SUBSCRIPTION_STATUS_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.billing.status.$get();
      if (!res.ok) {
        throw new Error(`Failed to fetch subscription status (${res.status})`);
      }
      return res.json() as Promise<SubscriptionStatus>;
    },
    staleTime: 30_000,
  });
}
