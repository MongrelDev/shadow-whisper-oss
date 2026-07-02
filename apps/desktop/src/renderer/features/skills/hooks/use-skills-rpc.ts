import { useQuery } from "@tanstack/react-query";
import type { Skill } from "../types/skill";

export function useSkillsList() {
  return useQuery({
    queryKey: ["skills", "list"],
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Skill[]> => {
      const result = await window.api.skills.list();
      if (!result.success) throw new Error(result.error ?? "Failed to load skills");
      return result.data ?? [];
    },
  });
}
