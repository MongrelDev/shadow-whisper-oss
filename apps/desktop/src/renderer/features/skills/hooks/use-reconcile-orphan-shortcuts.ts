import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useReconcileOrphanShortcuts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orphanIds: string[]): Promise<void> => {
      await Promise.all(orphanIds.map((id) => window.api.skills.setShortcut(id, null)));
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}
