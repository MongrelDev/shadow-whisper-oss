import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useInstallSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await window.api.skills.install(id);
      if (!result.success) throw new Error(result.error ?? "Failed to install skill");
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}
