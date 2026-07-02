import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateSkillBody, UpdateSkillBody, Skill } from "@whisper/api";

export function useCreateCustomSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateSkillBody): Promise<Skill & { markdown: string }> => {
      const result = await window.api.skillBuilder.create(body);
      if (!result.success || !result.data) {
        throw new Error(result.success ? "Empty response" : (result.error ?? "Create failed"));
      }
      return result.data.skill;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
    },
  });
}

export function useUpdateCustomSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: UpdateSkillBody;
    }): Promise<Skill & { markdown: string }> => {
      const result = await window.api.skillBuilder.update(id, body);
      if (!result.success || !result.data) {
        throw new Error(result.success ? "Empty response" : (result.error ?? "Update failed"));
      }
      return result.data.skill;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
    },
  });
}

export function useDeleteCustomSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const result = await window.api.skillBuilder.delete(id);
      if (!result.success) {
        throw new Error(result.error ?? "Delete failed");
      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["skills", "list"] });
    },
  });
}
