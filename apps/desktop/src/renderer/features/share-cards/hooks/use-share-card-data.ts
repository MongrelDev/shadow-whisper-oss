import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuthenticatedUser } from "~/hooks/use-auth-context";
import { useSubscriptionStatus } from "~/hooks/use-user";
import { ipcCall } from "~/lib/ipc";
import type { ShareCardData } from "../types";

export const SHARE_CARD_QUERY_KEY = ["usage", "shareCard"] as const;

function useShareCardStats() {
  return useQuery({
    queryKey: SHARE_CARD_QUERY_KEY,
    queryFn: () =>
      ipcCall(() => window.api.usage.getShareCardStats(), "Failed to load share card stats"),
    staleTime: 60_000,
  });
}

export function useShareCardData(): {
  data: ShareCardData | undefined;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const user = useAuthenticatedUser();
  const statsQuery = useShareCardStats();
  const subscriptionQuery = useSubscriptionStatus();

  const data = useMemo<ShareCardData | undefined>(() => {
    if (!statsQuery.data || !subscriptionQuery.data || subscriptionQuery.isPlaceholderData) {
      return undefined;
    }

    return {
      ...statsQuery.data,
      userName: user.name,
      plan: subscriptionQuery.data.plan,
    };
  }, [statsQuery.data, subscriptionQuery.data, subscriptionQuery.isPlaceholderData, user.name]);

  return {
    data,
    isLoading:
      statsQuery.isLoading || subscriptionQuery.isLoading || subscriptionQuery.isPlaceholderData,
    error: statsQuery.error ?? subscriptionQuery.error ?? null,
    retry: () => {
      void statsQuery.refetch();
      void subscriptionQuery.refetch();
    },
  };
}
