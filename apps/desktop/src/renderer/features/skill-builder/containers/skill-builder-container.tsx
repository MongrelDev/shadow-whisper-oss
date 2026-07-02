import { useState } from "react";
import { toast } from "sonner";
import type { Skill } from "@whisper/api";
import { useSkillBuild } from "../hooks/use-skill-build";
import { useSaveSkill } from "../hooks/use-save-skill";
import { useSkillBuilderModal } from "../hooks/use-skill-builder-modal";
import type { SkillDraft } from "../types/builder-message";
import { SkillBuilderModal } from "../modals/skill-builder-modal";

const EMPTY_DRAFT: SkillDraft = {
  markdown: "",
  slug: "",
  displayName: "",
  description: "",
  triggers: [],
};

function draftFromSkill(skill: Skill): SkillDraft {
  return {
    markdown: skill.markdown ?? "",
    slug: skill.slug,
    displayName: skill.displayName,
    description: skill.description ?? "",
    triggers: [...skill.triggers],
  };
}

interface SkillBuilderContainerProps {
  editSkill?: Skill | null;
}

export function SkillBuilderContainer({
  editSkill,
}: SkillBuilderContainerProps): React.ReactElement | null {
  const builder = useSkillBuilderModal();
  const buildMutation = useSkillBuild();
  const { save, isPending: isSaving, isEditMode } = useSaveSkill(editSkill);

  const [description, setDescription] = useState("");
  const [draft, setDraft] = useState<SkillDraft>(() =>
    editSkill ? draftFromSkill(editSkill) : EMPTY_DRAFT
  );

  if (!builder.isOpen) return null;

  function handleClose() {
    buildMutation.reset();
    builder.close();
  }

  function handleGenerate() {
    if (description.trim().length === 0) return;
    buildMutation.mutate(description, {
      onSuccess: (result) => {
        setDraft({
          markdown: result.markdown,
          displayName: result.displayName,
          description: result.description,
          slug: result.slug,
          triggers: result.triggers,
        });
        builder.goToStep("review");
      },
    });
  }

  function handleBuildManually() {
    setDraft({ ...EMPTY_DRAFT, description: description.trim() });
    builder.goToStep("review");
  }

  function handleSave() {
    save(draft, {
      onSuccess: () => builder.goToStep("done"),
      onError: (error) => toast.error(error.message),
    });
  }

  return (
    <SkillBuilderModal
      open={builder.isOpen}
      step={builder.step}
      onClose={handleClose}
      description={description}
      onDescriptionChange={setDescription}
      onGenerate={handleGenerate}
      onBuildManually={handleBuildManually}
      isGenerating={buildMutation.isPending}
      buildFailed={buildMutation.isError}
      draft={draft}
      onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      onSave={handleSave}
      isSaving={isSaving}
      isEditMode={isEditMode}
      onBack={builder.goBack}
    />
  );
}
