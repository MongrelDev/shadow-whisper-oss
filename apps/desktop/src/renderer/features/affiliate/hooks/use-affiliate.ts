import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedUser } from "@/hooks/use-auth-context";
import { ipcCall } from "@/lib/ipc";

export function useAffiliateEnabled() {
  return useQuery({
    queryKey: ["affiliate", "status"],
    queryFn: () =>
      ipcCall(() => window.api.affiliate.getStatus(), "Failed to check affiliate status"),
    staleTime: 10 * 60_000,
    select: (data) => data.enabled,
  });
}

export function useAffiliateProfile() {
  const { id: userId } = useAuthenticatedUser();
  return useQuery({
    queryKey: ["affiliate", "profile", userId],
    queryFn: () =>
      ipcCall(() => window.api.affiliate.getProfile(), "Failed to fetch affiliate profile"),
    staleTime: 5 * 60_000,
  });
}

export function useAffiliateDashboard() {
  const { id: userId } = useAuthenticatedUser();
  return useQuery({
    queryKey: ["affiliate", "dashboard", userId],
    queryFn: () =>
      ipcCall(() => window.api.affiliate.getDashboard(), "Failed to fetch affiliate dashboard"),
    staleTime: 60_000,
  });
}
