import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUninstallSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await window.api.skills.uninstall(id);
      if (!result.success) throw new Error(result.error ?? "Failed to uninstall skill");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
      void queryClient.invalidateQueries({ queryKey: ["config"] });
    },
  });
}
