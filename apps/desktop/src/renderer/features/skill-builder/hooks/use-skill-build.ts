import { useMutation } from "@tanstack/react-query";
import type { BuildSkillResponse } from "@whisper/api";

export function useSkillBuild() {
  return useMutation({
    mutationFn: async (description: string): Promise<BuildSkillResponse> => {
      const result = await window.api.skillBuilder.build({ description });
      if (!result.success || !result.data) {
        throw new Error(result.success ? "Empty response" : (result.error ?? "Build failed"));
      }
      return result.data;
    },
  });
}
