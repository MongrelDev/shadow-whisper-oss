import { useQuery } from "@tanstack/react-query";
import { ipcCall } from "../lib/ipc";
import type { SubscriptionStatus } from "../../shared/ipc-types";

const DEFAULT_STATUS: SubscriptionStatus = {
  plan: "free",
  status: "active",
  displayStatus: "free",
  trialEnd: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  canceledAt: null,
  usage: { spokenWords: 0, transformedWords: 0, totalWords: 0, limit: 2000 },
};

export function useSubscriptionStatus() {
  return useQuery({
    queryKey: ["user", "subscriptionStatus"],
    queryFn: () =>
      ipcCall(() => window.api.user.getSubscriptionStatus(), "Failed to fetch subscription status"),
    placeholderData: DEFAULT_STATUS,
    staleTime: 60_000,
  });
}
