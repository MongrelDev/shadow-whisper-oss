import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import type { SkillDraft } from "../types/builder-message";
import type { SkillBuilderStepId } from "../types";
import { SkillBuilderShell } from "../components/skill-builder-shell";
import { SkillBuilderFooter } from "../components/skill-builder-footer";
import { StepDescribe } from "../components/step-describe";
import { StepReview } from "../components/step-review";
import { StepDone } from "../components/step-done";

interface SkillBuilderModalProps {
  open: boolean;
  step: SkillBuilderStepId;
  onClose: () => void;

  description: string;
  onDescriptionChange: (v: string) => void;
  onGenerate: () => void;
  onBuildManually: () => void;
  isGenerating: boolean;
  buildFailed: boolean;

  draft: SkillDraft;
  onDraftChange: (patch: Partial<SkillDraft>) => void;
  onSave: () => void;
  isSaving: boolean;
  isEditMode: boolean;
  onBack: () => void;
}

function getSaveLabel(isSaving: boolean, isEditMode: boolean): string {
  if (isSaving) return m.skill_builder_creating();
  return isEditMode ? m.skill_builder_next_update() : m.skill_builder_next_create();
}

export function SkillBuilderModal(props: SkillBuilderModalProps): React.ReactElement {
  const { step, onClose, draft, isEditMode } = props;

  let content: React.ReactNode;
  let footer: React.ReactNode = null;

  switch (step) {
    case "describe":
      content = (
        <StepDescribe
          description={props.description}
          onDescriptionChange={props.onDescriptionChange}
          onGenerate={props.onGenerate}
          onBuildManually={props.onBuildManually}
          isGenerating={props.isGenerating}
          hasFailed={props.buildFailed}
        />
      );
      break;

    case "review": {
      const canSave =
        draft.displayName.trim().length > 0 &&
        draft.slug.trim().length > 0 &&
        draft.markdown.trim().length > 0;

      content = <StepReview draft={draft} onChange={props.onDraftChange} />;
      footer = (
        <SkillBuilderFooter
          showBack={!isEditMode}
          onBack={props.onBack}
          onNext={props.onSave}
          nextLabel={getSaveLabel(props.isSaving, isEditMode)}
          nextDisabled={!canSave}
          nextBusy={props.isSaving}
        />
      );
      break;
    }

    case "done":
      content = <StepDone skillName={draft.displayName} />;
      footer = (
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={onClose}>
            {m.skill_builder_done_close()}
          </Button>
          <Button onClick={onClose}>{m.skill_builder_done_cta()}</Button>
        </div>
      );
      break;
  }

  return (
    <SkillBuilderShell open={props.open} step={step} onClose={onClose} footer={footer}>
      {content}
    </SkillBuilderShell>
  );
}
