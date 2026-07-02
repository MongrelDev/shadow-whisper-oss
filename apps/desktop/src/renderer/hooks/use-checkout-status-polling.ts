import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ipcCall } from "../lib/ipc";
import type { CheckoutOrigin } from "./use-checkout";

const POLL_INTERVAL_MS = 2000;
const MAX_DURATION_MS = 5 * 60 * 1000;

interface UseCheckoutStatusPollingOptions {
  enabled: boolean;
  origin: CheckoutOrigin;
  onUpgraded?: () => void;
}

export function useCheckoutStatusPolling({
  enabled,
  origin,
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
    queryKey: ["user", "subscriptionStatus", "checkout-poll", origin],
    queryFn: () =>
      ipcCall(() => window.api.user.getSubscriptionStatus(), "Failed to fetch subscription status"),
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
    queryClient.invalidateQueries({ queryKey: ["user", "subscriptionStatus"] });
    queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    if (origin === "billing") toast.success("Plano atualizado");
    onUpgraded?.();
  }, [enabled, status, origin, onUpgraded, queryClient]);

  return { isPolling: enabled && !timedOut, timedOut };
}
