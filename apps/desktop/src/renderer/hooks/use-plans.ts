import { useQuery } from "@tanstack/react-query";
import { ipcCall } from "../lib/ipc";
import type { PlanInfo } from "../../shared/ipc-types";

export function usePlans() {
  return useQuery<PlanInfo[]>({
    queryKey: ["billing", "plans"],
    queryFn: () => ipcCall(() => window.api.user.getPlans(), "Failed to fetch plans"),
    staleTime: 300_000,
  });
}
