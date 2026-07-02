import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { SKILL_BUILDER_STEPS, isSkillBuilderStep, type SkillBuilderStepId } from "../types";

interface BuilderSearch {
  builder?: string;
}

export interface UseSkillBuilderModalResult {
  isOpen: boolean;
  step: SkillBuilderStepId;
  stepIndex: number;
  isFirst: boolean;
  isLast: boolean;
  open: () => void;
  goToStep: (step: SkillBuilderStepId) => void;
  goNext: () => void;
  goBack: () => void;
  close: () => void;
}

export function useSkillBuilderModal(): UseSkillBuilderModalResult {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ strict: false }) as BuilderSearch;

  const step: SkillBuilderStepId = isSkillBuilderStep(search.builder) ? search.builder : "describe";
  const isOpen = isSkillBuilderStep(search.builder);
  const stepIndex = SKILL_BUILDER_STEPS.indexOf(step);

  function setSearch(patch: (prev: Record<string, unknown>) => Record<string, unknown>) {
    void navigate({
      to: location.pathname as never,
      search: ((prev: Record<string, unknown> | undefined) => patch(prev ?? {})) as never,
    });
  }

  function goToStep(next: SkillBuilderStepId) {
    setSearch((prev) => ({ ...prev, builder: next }));
  }

  function open() {
    goToStep("describe");
  }

  function goNext() {
    const next = SKILL_BUILDER_STEPS[stepIndex + 1];
    if (next) goToStep(next);
  }

  function goBack() {
    const prev = SKILL_BUILDER_STEPS[stepIndex - 1];
    if (prev) goToStep(prev);
  }

  function close() {
    setSearch((prev) => {
      const rest = { ...prev };
      delete rest.builder;
      delete rest.editSkill;
      return rest;
    });
  }

  return {
    isOpen,
    step,
    stepIndex,
    isFirst: stepIndex === 0,
    isLast: step === "done",
    open,
    goToStep,
    goNext,
    goBack,
    close,
  };
}
