import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "motion/react";
import { Settings } from "lucide-react";
import { Toaster } from "sonner";
import { m } from "~/paraglide/messages";
import { acceleratorToDisplay } from "@/lib/accelerator";
import { useConfig } from "@/hooks/use-config";
import { ActiveRecordingPill, ProcessingPill } from "../components/active-recording-pill";
import { MinimizedPill } from "../components/minimized-pill";
import { FeedbackPill } from "../components/feedback-pill";
import { SkillDiscoveryNudge } from "../components/skill-discovery-nudge";
import { CleanupDiffNudge } from "../components/cleanup-diff-nudge";
import { usePillController } from "../hooks/use-pill-controller";
import { useSkillDiscoveryNudge } from "../hooks/use-skill-discovery-nudge";
import { RecordingSessionProvider } from "../providers/recording-session-provider";
import type { FeedbackKind } from "../stores/pill-store";
import { usePillBadgeUnlock } from "@/features/progress/pill/hooks/use-pill-badge-unlock";
import { DiffPanel } from "../components/diff-panel";
import { usePillStore } from "../stores/pill-store";

type PillScene =
  | { type: "feedback"; feedback: FeedbackKind }
  | { type: "recording" }
  | { type: "transcribing" }
  | { type: "applying-skill" }
  | { type: "minimized" };

type SessionPhase = ReturnType<typeof usePillController>["session"]["phase"];
type RouteView = ReturnType<typeof usePillController>["routeView"];

function resolveSessionScene(phase: SessionPhase, routeView: RouteView): PillScene {
  if (phase === "processing") return { type: "transcribing" };
  if (phase === "connecting" || phase === "recording") return { type: "recording" };
  if (routeView === "recording") return { type: "transcribing" };
  return { type: "minimized" };
}

function resolvePillScene(input: {
  isApplyingSkill: boolean;
  feedback: FeedbackKind | null;
  phase: SessionPhase;
  routeView: RouteView;
}): PillScene {
  if (input.isApplyingSkill) return { type: "applying-skill" };
  if (input.feedback) return { type: "feedback", feedback: input.feedback };
  return resolveSessionScene(input.phase, input.routeView);
}

function renderPillScene(
  scene: PillScene,
  pill: ReturnType<typeof usePillController>
): React.ReactElement {
  if (scene.type === "feedback") {
    return (
      <FeedbackScene
        key="feedback"
        feedback={scene.feedback}
        onRetry={pill.handleRetryLast}
        shortcutAccelerator={pill.shortcutAccelerator}
      />
    );
  }

  if (scene.type === "recording") {
    return (
      <ActiveRecordingPill
        key="recording-session"
        isSpeaking={pill.session.isSpeaking}
        volumeLevel={pill.session.volumeLevel}
        waveformHistory={pill.session.waveformHistory}
        onCancel={pill.handleCancel}
        onStop={pill.handleStop}
      />
    );
  }

  if (scene.type === "transcribing") {
    return <ProcessingPill key="processing-session" />;
  }

  if (scene.type === "applying-skill") {
    return <ProcessingPill key="applying-skill" />;
  }

  return (
    <MinimizedPill
      key="minimized"
      onUpgrade={pill.openUpgrade}
      isLimitReached={pill.isLimitReached}
      limitTriggered={pill.limitTriggered}
      onLimitDismiss={pill.dismissLimitTrigger}
      shortcutAccelerator={pill.shortcutAccelerator}
    />
  );
}

function renderPillSurface(args: {
  showCleanupDiffNudge: boolean;
  showSkillDiscoveryNudge: boolean;
  viewLastDiffAccelerator: string;
  onOpenCleanupDiff: () => void;
  onDismissCleanupDiff: () => void;
  onNavigateToSkills: () => void;
  onDismiss: () => void;
  scene: PillScene;
  pill: ReturnType<typeof usePillController>;
}): React.ReactElement {
  if (args.showCleanupDiffNudge) {
    return (
      <CleanupDiffNudge
        key="cleanup-diff-nudge"
        shortcutAccelerator={args.viewLastDiffAccelerator}
        onOpenDiff={args.onOpenCleanupDiff}
        onDismiss={args.onDismissCleanupDiff}
      />
    );
  }
  if (args.showSkillDiscoveryNudge) {
    return (
      <SkillDiscoveryNudge
        key="skill-discovery-nudge"
        onNavigateToSkills={args.onNavigateToSkills}
        onDismiss={args.onDismiss}
      />
    );
  }
  return renderPillScene(args.scene, args.pill);
}

function usePillMousePassthrough(): {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
} {
  const onMouseEnter = useCallback(() => {
    window.api.recording.setIgnoreMouseEvents(false);
  }, []);

  const onMouseLeave = useCallback(() => {
    window.api.recording.setIgnoreMouseEvents(true);
  }, []);

  return { onMouseEnter, onMouseLeave };
}

function useSkillApplying(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => window.api.recording.onSkillApplying(setActive), []);
  return active;
}

function useSkillDiscoveryNudgeHandlers(): {
  nudgeEligible: boolean;
  onShow: () => void;
  onNavigateToSkills: () => void;
  onDismiss: () => void;
} {
  const nudgeEligible = useSkillDiscoveryNudge();
  const { config, updateConfig } = useConfig();

  const onShow = useCallback(() => {
    updateConfig({
      nudges: {
        skillDiscovery: {
          lastShownAt: new Date().toISOString(),
          timesShown: config.nudges.skillDiscovery.timesShown + 1,
        },
      },
    });
  }, [config.nudges.skillDiscovery.timesShown, updateConfig]);

  const onNavigateToSkills = useCallback(() => {
    updateConfig({
      nudges: {
        skillDiscovery: { lastClickedAt: new Date().toISOString() },
      },
    });
    window.api.app.openRoute("/app/skills");
  }, [updateConfig]);

  const onDismiss = useCallback(() => {
    updateConfig({
      nudges: {
        skillDiscovery: { lastShownAt: new Date().toISOString() },
      },
    });
  }, [updateConfig]);

  return { nudgeEligible, onShow, onNavigateToSkills, onDismiss };
}

function useCleanupDiffNudgeHandlers(): {
  nudgeData: { rawText: string; formattedText: string } | null;
  onOpenDiff: () => void;
  onDismiss: () => void;
} {
  const cleanupDiffNudgeData = usePillStore((s) => s.cleanupDiffNudgeData);
  const openDiffPanel = usePillStore((s) => s.openDiffPanel);
  const clearActiveNudge = usePillStore((s) => s.clearActiveNudge);
  const { updateConfig } = useConfig();

  const onOpenDiff = useCallback(() => {
    if (cleanupDiffNudgeData == null) return;
    openDiffPanel(cleanupDiffNudgeData.rawText, cleanupDiffNudgeData.formattedText);
    clearActiveNudge();
    updateConfig({ nudges: { cleanupDiff: { lastClickedAt: new Date().toISOString() } } });
  }, [cleanupDiffNudgeData, openDiffPanel, clearActiveNudge, updateConfig]);

  const onDismiss = useCallback(() => {
    clearActiveNudge();
  }, [clearActiveNudge]);

  return { nudgeData: cleanupDiffNudgeData, onOpenDiff, onDismiss };
}

function PillPageContent(): React.ReactElement {
  const pill = usePillController();
  const isApplyingSkill = useSkillApplying();
  usePillBadgeUnlock();
  const passthrough = usePillMousePassthrough();
  const diffPanelOpen = usePillStore((s) => s.diffPanelOpen);
  const activeNudge = usePillStore((s) => s.activeNudge);
  const { nudgeEligible, onShow, onNavigateToSkills, onDismiss } = useSkillDiscoveryNudgeHandlers();
  const {
    nudgeData: cleanupNudgeData,
    onOpenDiff: onOpenCleanupDiff,
    onDismiss: onDismissCleanupDiff,
  } = useCleanupDiffNudgeHandlers();
  const { config } = useConfig();

  const scene: PillScene = useMemo(
    () =>
      resolvePillScene({
        isApplyingSkill,
        feedback: pill.feedback,
        phase: pill.session.phase,
        routeView: pill.routeView,
      }),
    [isApplyingSkill, pill.feedback, pill.routeView, pill.session.phase]
  );

  const showCleanupDiffNudge =
    activeNudge === "cleanup-diff" && cleanupNudgeData != null && scene.type === "minimized";
  const showSkillDiscoveryNudge =
    !showCleanupDiffNudge && nudgeEligible && scene.type === "minimized";

  useEffect(() => {
    if (showSkillDiscoveryNudge) onShow();
    // onShow is stable across renders — only run when nudge becomes visible
  }, [showSkillDiscoveryNudge]);

  return (
    <div className="relative flex h-screen items-end justify-center">
      <div
        className="relative inline-flex max-w-[560px] flex-col items-center gap-2"
        onMouseEnter={passthrough.onMouseEnter}
        onMouseLeave={passthrough.onMouseLeave}
      >
        <AnimatePresence mode="wait" initial={false}>
          {diffPanelOpen ? <DiffPanel key="diff-panel" /> : null}
        </AnimatePresence>
        <AnimatePresence mode="wait" initial={false}>
          {renderPillSurface({
            showCleanupDiffNudge,
            showSkillDiscoveryNudge,
            viewLastDiffAccelerator: config.shortcuts.viewLastDiff,
            onOpenCleanupDiff,
            onDismissCleanupDiff,
            onNavigateToSkills,
            onDismiss,
            scene,
            pill,
          })}
        </AnimatePresence>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
}

function FeedbackScene({
  feedback,
  onRetry,
  shortcutAccelerator,
}: {
  feedback: FeedbackKind;
  onRetry: () => void;
  shortcutAccelerator?: string;
}): React.ReactElement {
  if (feedback.kind === "no-text-field") {
    return <NoTextFieldFeedback />;
  }

  if (feedback.kind === "transcription-failed") {
    return (
      <FeedbackPill tone="error">
        <FeedbackPill.Reason>{m.pill_feedback_transcription_failed_reason()}</FeedbackPill.Reason>
        <FeedbackPill.Separator />
        <FeedbackPill.Action onClick={feedback.onRetry ?? onRetry}>
          {m.pill_feedback_try_again()}
        </FeedbackPill.Action>
      </FeedbackPill>
    );
  }

  return <GenericFeedback feedback={feedback} shortcutAccelerator={shortcutAccelerator} />;
}

function NoTextFieldFeedback(): React.ReactElement {
  const pasteKeys = ["⌘", "V"];
  return (
    <FeedbackPill tone="error">
      <FeedbackPill.Reason>{m.pill_feedback_no_text_field_reason()}</FeedbackPill.Reason>
      <FeedbackPill.Separator />
      <FeedbackPill.Hint>
        <span>{m.pill_feedback_no_text_field_hint_prefix()}</span>
        <FeedbackPill.ShortcutChips keys={pasteKeys} />
        <span>{m.pill_feedback_no_text_field_hint_paste()}</span>
      </FeedbackPill.Hint>
    </FeedbackPill>
  );
}

function GenericFeedback({
  feedback,
  shortcutAccelerator,
}: {
  feedback: Extract<FeedbackKind, { kind: "generic" }>;
  shortcutAccelerator?: string;
}): React.ReactElement {
  const keys = shortcutAccelerator ? acceleratorToDisplay(shortcutAccelerator) : [];
  return (
    <FeedbackPill tone="error">
      <FeedbackPill.Reason>{feedback.reason}</FeedbackPill.Reason>
      {feedback.hint ? (
        <>
          <FeedbackPill.Separator />
          <FeedbackPill.Hint>
            <span>{feedback.hint}</span>
            {keys.length > 0 ? <FeedbackPill.ShortcutChips keys={keys} /> : null}
          </FeedbackPill.Hint>
        </>
      ) : null}
      {feedback.action ? (
        <>
          <FeedbackPill.Separator />
          <FeedbackPill.Action
            onClick={feedback.action.onClick}
            icon={<Settings className="size-3" strokeWidth={2.2} aria-hidden />}
          >
            {feedback.action.label}
          </FeedbackPill.Action>
        </>
      ) : null}
    </FeedbackPill>
  );
}

export function PillPage(): React.ReactElement {
  return (
    <RecordingSessionProvider>
      <PillPageContent />
    </RecordingSessionProvider>
  );
}
