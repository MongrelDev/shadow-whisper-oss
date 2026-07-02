import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SubscriptionStatus } from "@whisper/api";
import { apiClient } from "~/lib/api-client";
import { SUBSCRIPTION_STATUS_QUERY_KEY } from "./use-subscription-status";

const POLL_INTERVAL_MS = 2000;
const MAX_DURATION_MS = 5 * 60 * 1000;

function clearCheckoutInProgress() {
  if (typeof chrome === "undefined") return;
  if (!chrome.storage?.session) return;
  chrome.storage.session.remove("checkoutInProgress");
}

interface UseCheckoutStatusPollingOptions {
  enabled: boolean;
  onUpgraded?: () => void;
}

export function useCheckoutStatusPolling({
  enabled,
  onUpgraded,
}: UseCheckoutStatusPollingOptions): { isPolling: boolean; timedOut: boolean } {
  const queryClient = useQueryClient();
  const startedAt = useRef<number | null>(null);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!enabled) {
      startedAt.current = null;
      setTimedOut(false);
      return;
    }
    startedAt.current = Date.now();
    const timer = setTimeout(() => setTimedOut(true), MAX_DURATION_MS);
    return () => clearTimeout(timer);
  }, [enabled]);

  const query = useQuery({
    queryKey: ["billing", "subscriptionStatus", "checkout-poll"],
    queryFn: async () => {
      const res = await apiClient.billing.status.$get();
      if (!res.ok) {
        throw new Error(`Failed to fetch subscription status (${res.status})`);
      }
      return res.json() as Promise<SubscriptionStatus>;
    },
    enabled: enabled && !timedOut,
    refetchInterval: POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 0,
  });

  const status = query.data?.displayStatus;

  useEffect(() => {
    if (!enabled) return;
    if (status !== "active") return;

    queryClient.invalidateQueries({ queryKey: SUBSCRIPTION_STATUS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["auth", "session"] });

    clearCheckoutInProgress();

    onUpgraded?.();
  }, [enabled, status, onUpgraded, queryClient]);

  return { isPolling: enabled && !timedOut, timedOut };
}
