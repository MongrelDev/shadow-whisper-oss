import { useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { playUiSound } from "@/lib/ui-sounds";
import { requestMicrophoneAccess } from "@/lib/request-microphone-access";
import { db } from "@/lib/db";
import { useLastTranscription } from "./use-last-transcription";
import { useTranscriptionSettings } from "./use-transcription-settings";
import { usePillStore } from "../stores/pill-store";
import type { PillStore } from "../stores/pill-store";
import { useRecordingSessionContext } from "../providers/recording-session-provider";

function showMicPermissionFeedback(showFeedback: PillStore["showFeedback"]): void {
  playUiSound("error");
  showFeedback({
    kind: "generic",
    reason: m.pill_mic_permission_required(),
    action: {
      label: m.pill_mic_permission_action(),
      onClick: () => window.api.settings.openMicrophonePrivacy(),
    },
  });
}

export function usePillController() {
  const navigate = useNavigate();
  const { view: routeView } = useSearch({ from: "/pill" });
  const { config } = useTranscriptionSettings();
  const lastTranscription = useLastTranscription();
  const { session } = useRecordingSessionContext();

  const {
    feedback,
    isLimitReached,
    limitTriggered,
    lastCompleted,
    showFeedback,
    clearFeedback,
    dismissLimitTrigger,
    closeDiffPanel,
    openDiffPanel,
  } = usePillStore();

  const goMinimized = useCallback(
    () => void navigate({ to: "/pill", search: { view: "minimized" } }),
    [navigate]
  );

  const openUpgrade = useCallback(() => {
    window.api.app.showMainWindow();
    dismissLimitTrigger();
  }, [dismissLimitTrigger]);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  const handleCancel = useCallback(() => {
    playUiSound("cancel");
    void sessionRef.current.cancel();
    goMinimized();
    window.api.recording.cancel();
  }, [goMinimized]);

  const handleStop = useCallback(() => {
    const phase = sessionRef.current.phase;
    if (phase !== "recording" && phase !== "connecting") return;
    playUiSound("stop");
    window.api.recording.notifyStopped();
    void sessionRef.current.stop();
  }, []);

  const handleCopyLastTranscript = useCallback(async () => {
    try {
      const text = lastTranscription?.formattedText ?? lastCompleted?.formattedText;
      if (!text) return;
      await navigator.clipboard.writeText(text);
      goMinimized();
    } catch {
      // silently fail
    }
  }, [goMinimized, lastCompleted?.formattedText, lastTranscription?.formattedText]);

  const startRecordingFlow = useCallback(async () => {
    const currentSession = sessionRef.current;
    const sessionIsBusy = currentSession.phase !== "idle" || currentSession.activeSession !== null;
    if (sessionIsBusy) {
      console.warn("[pill-controller] start ignored while session is busy", {
        phase: currentSession.phase,
        hasActiveSession: currentSession.activeSession !== null,
      });
      return;
    }

    const micGranted = await requestMicrophoneAccess();
    if (!micGranted) {
      showMicPermissionFeedback(showFeedback);
      window.api.recording.cancel();
      return;
    }

    clearFeedback();
    closeDiffPanel();
    void navigate({ to: "/pill", search: { view: "recording" } });
    const started = await sessionRef.current.start();
    if (started) playUiSound("start");
  }, [clearFeedback, closeDiffPanel, navigate, showFeedback]);

  const handleRetryLast = useCallback(() => {
    clearFeedback();
    void startRecordingFlow();
  }, [clearFeedback, startRecordingFlow]);

  const handleViewLastDiff = useCallback(async () => {
    const entry = await db.transcriptions.orderBy("createdAt").reverse().first();
    if (!entry) {
      console.warn("[pill] view-last-diff: no transcription in history");
      return;
    }
    const { rawText, formattedText } = entry;
    if (!rawText || !formattedText) {
      console.warn("[pill] view-last-diff: last entry missing rawText/formattedText");
      return;
    }
    openDiffPanel(rawText, formattedText);
  }, [openDiffPanel]);

  // IPC listeners
  useEffect(() => {
    const cleanupStart = window.api.recording.onStart(() => void startRecordingFlow());
    const cleanupStop = window.api.recording.onStop(() => handleStop());
    const cleanupCancelShortcut = window.api.recording.onCancelShortcut(() => handleCancel());
    const cleanupViewLastDiff = window.api.recording.onViewLastDiff(
      () => void handleViewLastDiff()
    );

    return () => {
      cleanupStart();
      cleanupStop();
      cleanupCancelShortcut();
      cleanupViewLastDiff();
    };
  }, [handleCancel, handleStop, handleViewLastDiff, startRecordingFlow]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCancel();
      else if (e.key === "Enter") handleStop();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleCancel, handleStop]);

  return {
    routeView,
    session,
    feedback,
    showFeedback,
    clearFeedback,
    handleRetryLast,
    lastTranscription: lastTranscription ?? lastCompleted ?? undefined,
    shortcutAccelerator: config.shortcuts.transcription,
    isLimitReached,
    limitTriggered,
    dismissLimitTrigger,
    handleCancel,
    handleStop,
    handleCopyLastTranscript,
    goMinimized,
    openUpgrade,
  };
}
