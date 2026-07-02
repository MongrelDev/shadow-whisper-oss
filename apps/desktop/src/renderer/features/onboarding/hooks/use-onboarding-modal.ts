import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearch } from "@tanstack/react-router";
import { useConfig } from "@/hooks/use-config";
import {
  ONBOARDING_STEPS,
  ONBOARDING_TOTAL_VISIBLE,
  isOnboardingStep,
  type OnboardingStepId,
} from "../types";

interface OnboardingSearch {
  onboarding?: string;
}

export interface UseOnboardingModalResult {
  isOpen: boolean;
  step: OnboardingStepId;
  stepIndex: number;
  totalVisible: number;
  isFirst: boolean;
  isLast: boolean;
  goToStep: (step: OnboardingStepId) => void;
  goNext: () => void;
  goBack: () => void;
  close: () => void;
  complete: () => void;
}

export function useOnboardingModal(): UseOnboardingModalResult {
  const navigate = useNavigate();
  const location = useLocation();
  const search = useSearch({ strict: false }) as OnboardingSearch;
  const { updateConfig } = useConfig();

  const step: OnboardingStepId = isOnboardingStep(search.onboarding)
    ? search.onboarding
    : "welcome";
  const isOpen = isOnboardingStep(search.onboarding);
  const stepIndex = ONBOARDING_STEPS.indexOf(step);

  const setSearch = useCallback(
    (patch: (prev: Record<string, unknown>) => Record<string, unknown>) => {
      void navigate({
        to: location.pathname as never,
        search: ((prev: Record<string, unknown> | undefined) => patch(prev ?? {})) as never,
      });
    },
    [navigate, location.pathname]
  );

  const goToStep = useCallback(
    (next: OnboardingStepId) => {
      setSearch((prev) => ({ ...prev, onboarding: next }));
    },
    [setSearch]
  );

  const goNext = useCallback(() => {
    const next = ONBOARDING_STEPS[stepIndex + 1];
    if (next) goToStep(next);
  }, [stepIndex, goToStep]);

  const goBack = useCallback(() => {
    const prev = ONBOARDING_STEPS[stepIndex - 1];
    if (prev) goToStep(prev);
  }, [stepIndex, goToStep]);

  const close = useCallback(() => {
    setSearch((prev) => {
      const { onboarding: _omit, ...rest } = prev;
      return rest;
    });
  }, [setSearch]);

  const complete = useCallback(() => {
    updateConfig({ preferences: { onboardingCompleted: true } });
    close();
  }, [updateConfig, close]);

  return useMemo(
    () => ({
      isOpen,
      step,
      stepIndex,
      totalVisible: ONBOARDING_TOTAL_VISIBLE,
      isFirst: stepIndex === 0,
      isLast: step === "done",
      goToStep,
      goNext,
      goBack,
      close,
      complete,
    }),
    [isOpen, step, stepIndex, goToStep, goNext, goBack, close, complete]
  );
}
