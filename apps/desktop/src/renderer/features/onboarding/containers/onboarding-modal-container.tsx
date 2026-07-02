import { useState } from "react";
import { useConfig } from "@/hooks/use-config";
import { m } from "~/paraglide/messages";
import { OnboardingShell } from "../components/onboarding-shell";
import { OnboardingFooter } from "../components/onboarding-footer";
import { StepWelcome } from "../components/step-welcome";
import { StepPermissions } from "../components/step-permissions";
import { StepShortcut } from "../components/step-shortcut";
import { StepSkills } from "../components/step-skills";
import { StepDone } from "../components/step-done";
import { StepPlanContainer } from "./step-plan-container";
import { useOnboardingModal } from "../hooks/use-onboarding-modal";

function buildShortcutPersistor() {
  return (accelerator: string) => {
    void window.api.shortcuts.set("transcription", accelerator).catch(() => {});
  };
}

function resolveSelectedDeviceId(
  config: ReturnType<typeof useConfig>["config"]
): string | undefined {
  return typeof config.preferences.audio.inputDeviceId === "string"
    ? config.preferences.audio.inputDeviceId
    : undefined;
}

function buildOnboardingCloseHandler(onboarding: ReturnType<typeof useOnboardingModal>) {
  return (open: boolean) => {
    if (!open) onboarding.complete();
  };
}

function renderDoneFooter(onComplete: () => void): React.ReactElement {
  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={onComplete}
        className="px-5 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        {m.onboarding_done_cta()}
      </button>
    </div>
  );
}

function renderPermissionsStep({
  onboarding,
  micGranted,
  accGranted,
  setMicGranted,
  setAccGranted,
  updateConfig,
  selectedDeviceId,
  canGoBack,
}: {
  onboarding: ReturnType<typeof useOnboardingModal>;
  micGranted: boolean;
  accGranted: boolean;
  setMicGranted: (value: boolean) => void;
  setAccGranted: (value: boolean) => void;
  updateConfig: ReturnType<typeof useConfig>["updateConfig"];
  selectedDeviceId: string | undefined;
  canGoBack: boolean;
}): { content: React.ReactNode; footer: React.ReactNode } {
  return {
    content: (
      <StepPermissions
        microphoneGranted={micGranted}
        accessibilityGranted={accGranted}
        onUpdate={(patch) => {
          if (patch.microphoneGranted !== undefined) setMicGranted(patch.microphoneGranted);
          if (patch.accessibilityGranted !== undefined) setAccGranted(patch.accessibilityGranted);
        }}
        onDeviceSelected={(deviceId) =>
          updateConfig({ preferences: { audio: { inputDeviceId: deviceId } } })
        }
        selectedDeviceId={selectedDeviceId}
      />
    ),
    footer: (
      <OnboardingFooter
        onBack={onboarding.goBack}
        onNext={onboarding.goNext}
        showBack={canGoBack}
        nextLabel={m.onboarding_modal_next_continue()}
        nextDisabled={!micGranted}
      />
    ),
  };
}

function renderOnboardingStep({
  step,
  onboarding,
  micGranted,
  accGranted,
  setMicGranted,
  setAccGranted,
  updateConfig,
  selectedDeviceId,
  shortcutAccelerator,
  persistShortcut,
  onPlanNext,
}: {
  step: ReturnType<typeof useOnboardingModal>["step"];
  onboarding: ReturnType<typeof useOnboardingModal>;
  micGranted: boolean;
  accGranted: boolean;
  setMicGranted: (value: boolean) => void;
  setAccGranted: (value: boolean) => void;
  updateConfig: ReturnType<typeof useConfig>["updateConfig"];
  selectedDeviceId: string | undefined;
  shortcutAccelerator: string;
  persistShortcut: (accelerator: string) => void;
  onPlanNext: () => void;
}): { content: React.ReactNode; footer: React.ReactNode } {
  const canGoBack = !onboarding.isFirst && step !== "done";
  const stepRenderers = {
    welcome: () => ({
      content: <StepWelcome />,
      footer: (
        <OnboardingFooter
          onBack={onboarding.goBack}
          onNext={onboarding.goNext}
          showBack={canGoBack}
          nextLabel={m.onboarding_modal_next_get_started()}
        />
      ),
    }),
    permissions: () =>
      renderPermissionsStep({
        onboarding,
        micGranted,
        accGranted,
        setMicGranted,
        setAccGranted,
        updateConfig,
        selectedDeviceId,
        canGoBack,
      }),
    shortcut: () => ({
      content: <StepShortcut accelerator={shortcutAccelerator} onChange={persistShortcut} />,
      footer: (
        <OnboardingFooter
          onBack={onboarding.goBack}
          onNext={onboarding.goNext}
          showBack={canGoBack}
          nextLabel={m.onboarding_modal_next_continue()}
        />
      ),
    }),
    skills: () => ({
      content: <StepSkills />,
      footer: (
        <OnboardingFooter
          onBack={onboarding.goBack}
          onNext={onboarding.goNext}
          showBack={canGoBack}
          nextLabel={m.onboarding_modal_next_continue()}
        />
      ),
    }),
    plan: () => ({
      content: <StepPlanContainer onNext={onPlanNext} />,
      footer: (
        <OnboardingFooter
          onBack={onboarding.goBack}
          onSkipStep={onPlanNext}
          onNext={onPlanNext}
          showBack={canGoBack}
          showSkipStep
          nextLabel={m.onboarding_modal_next_continue()}
        />
      ),
    }),
    done: () => ({
      content: <StepDone />,
      footer: renderDoneFooter(onboarding.complete),
    }),
  } as const;

  return stepRenderers[step]();
}

export function OnboardingModalContainer(): React.ReactElement | null {
  const onboarding = useOnboardingModal();
  const { config, updateConfig } = useConfig();

  const [micGranted, setMicGranted] = useState(false);
  const [accGranted, setAccGranted] = useState(false);

  if (!onboarding.isOpen) return null;

  const persistShortcut = buildShortcutPersistor();
  const shortcutAccelerator = config.shortcuts.transcription;
  const selectedDeviceId = resolveSelectedDeviceId(config);

  const handleSkipAll = () => {
    onboarding.complete();
  };

  const handlePlanNext = () => {
    onboarding.goToStep("done");
  };
  const { content, footer } = renderOnboardingStep({
    step: onboarding.step,
    onboarding,
    micGranted,
    accGranted,
    setMicGranted,
    setAccGranted,
    updateConfig,
    selectedDeviceId,
    shortcutAccelerator,
    persistShortcut,
    onPlanNext: handlePlanNext,
  });

  return (
    <OnboardingShell
      open={onboarding.isOpen}
      step={onboarding.step}
      onOpenChange={buildOnboardingCloseHandler(onboarding)}
      onSkipAll={handleSkipAll}
      showSkipAsClose={onboarding.step === "done"}
      footer={footer}
    >
      {content}
    </OnboardingShell>
  );
}
