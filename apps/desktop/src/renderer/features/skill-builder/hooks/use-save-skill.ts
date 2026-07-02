import type { Skill } from "@whisper/api";
import { useCreateCustomSkill, useUpdateCustomSkill } from "./use-custom-skill-mutations";
import type { SkillDraft } from "../types/builder-message";

interface SaveOptions {
  onSuccess: (skill: Skill & { markdown: string }) => void;
  onError: (error: Error) => void;
}

export function useSaveSkill(editSkill: Skill | null | undefined) {
  const createMutation = useCreateCustomSkill();
  const updateMutation = useUpdateCustomSkill();

  const isEditMode = editSkill != null;
  const isPending = createMutation.isPending || updateMutation.isPending;

  function save(draft: SkillDraft, options: SaveOptions) {
    const body = {
      markdown: draft.markdown,
      displayName: draft.displayName,
      description: draft.description,
      slug: draft.slug,
      triggers: [...draft.triggers],
    };

    if (isEditMode && editSkill) {
      updateMutation.mutate({ id: editSkill.id, body }, options);
    } else {
      createMutation.mutate(body, options);
    }
  }

  return { save, isPending, isEditMode };
}
