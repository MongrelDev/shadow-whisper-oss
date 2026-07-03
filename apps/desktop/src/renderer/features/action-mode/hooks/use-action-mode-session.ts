import { useCallback, useEffect, useRef, useState } from "react";
import { m } from "~/paraglide/messages";
import { getLocale } from "~/paraglide/runtime";
import { playUiSound } from "@/lib/ui-sounds";
import { requestMicrophoneAccess } from "@/lib/request-microphone-access";
import { useConfig } from "@/hooks/use-config";
import { useInteractionMode } from "@/providers/interaction-mode-provider";
import { useAudioCapture } from "@/features/transcription/hooks/use-audio-capture";
import { usePillStore } from "@/features/transcription/stores/pill-store";
import type { ActionModeExecuteIpcResult } from "../../../../shared/ipc-types";

export type ActionModePhase = "idle" | "recording" | "processing";

export interface UseActionModeSessionReturn {
  phase: ActionModePhase;
  isSpeaking: boolean;
  volumeLevel: number;
  waveformHistory: number[];
  start: () => Promise<void>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
}

const ACTION_MODE_SESSION_OWNER = "action-mode-session";

const INTERACTION_MODE_BY_PHASE = {
  idle: null,
  recording: "recording-audio",
  processing: "processing-transcription",
} as const;

function failureMessage(result: Extract<ActionModeExecuteIpcResult, { ok: false }>): string {
  if (result.reason === "quota_exceeded") return m.pill_action_mode_limit_reached();
  if (result.reason === "rate_limited") return m.pill_action_mode_rate_limited();
  return m.pill_action_mode_failed_reason();
}

async function submitAction(audioBlob: Blob): Promise<ActionModeExecuteIpcResult> {
  try {
    const audioBuffer = await audioBlob.arrayBuffer();
    return await window.api.actionMode.execute({
      audioBuffer,
      contentType: audioBlob.type || "audio/webm",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      language: getLocale() ?? null,
    });
  } catch {
    return { ok: false, reason: "internal" };
  }
}

export function useActionModeSession(): UseActionModeSessionReturn {
  const [phase, setPhase] = useState<ActionModePhase>("idle");
  const { config } = useConfig();
  const interactionMode = useInteractionMode();
  const inputDeviceId = config.preferences.audio.inputDeviceId;

  const showFeedback = usePillStore((s) => s.showFeedback);
  const triggerLimit = usePillStore((s) => s.triggerLimit);

  const phaseRef = useRef<ActionModePhase>(phase);
  phaseRef.current = phase;
  const isCancellingRef = useRef(false);

  const updatePhase = useCallback((next: ActionModePhase) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const abortToIdle = useCallback(() => {
    updatePhase("idle");
    window.api.actionMode.cancel();
  }, [updatePhase]);

  const handleFailure = useCallback(
    (result: Extract<ActionModeExecuteIpcResult, { ok: false }>) => {
      playUiSound("error");
      if (result.reason === "quota_exceeded") {
        triggerLimit();
        return;
      }
      showFeedback({ kind: "generic", reason: failureMessage(result) });
    },
    [showFeedback, triggerLimit]
  );

  const executeAction = useCallback(
    async (audioBlob: Blob) => {
      updatePhase("processing");
      const result = await submitAction(audioBlob);
      updatePhase("idle");

      if (!result.ok) {
        handleFailure(result);
        return;
      }
      if (result.notice) {
        showFeedback({ kind: "generic", reason: result.notice });
      }
    },
    [handleFailure, showFeedback, updatePhase]
  );

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, meta: { hadSpeechActivity: boolean }) => {
      if (isCancellingRef.current) {
        isCancellingRef.current = false;
        abortToIdle();
        return;
      }
      if (!meta.hadSpeechActivity) {
        playUiSound("error");
        showFeedback({ kind: "generic", reason: m.pill_transcription_no_audio_detected() });
        abortToIdle();
        return;
      }
      await executeAction(audioBlob);
    },
    [abortToIdle, executeAction, showFeedback]
  );

  const handleCaptureError = useCallback(
    (error: Error) => {
      playUiSound("error");
      if (error.name === "NotAllowedError") {
        showFeedback({
          kind: "generic",
          reason: m.pill_mic_permission_required(),
          action: {
            label: m.pill_mic_permission_action(),
            onClick: () => window.api.settings.openMicrophonePrivacy(),
          },
        });
      }
      abortToIdle();
    },
    [abortToIdle, showFeedback]
  );

  const capture = useAudioCapture({
    deviceId: typeof inputDeviceId === "string" ? inputDeviceId : undefined,
    onRecordingComplete: handleRecordingComplete,
    onError: handleCaptureError,
  });

  useEffect(() => {
    const mode = INTERACTION_MODE_BY_PHASE[phase];
    if (mode) {
      void interactionMode.setMode(mode, ACTION_MODE_SESSION_OWNER);
      return;
    }
    void interactionMode.clearMode(ACTION_MODE_SESSION_OWNER);
  }, [interactionMode, phase]);

  useEffect(() => {
    return () => {
      void interactionMode.clearMode(ACTION_MODE_SESSION_OWNER);
    };
  }, [interactionMode]);

  const start = useCallback(async () => {
    // Main already set isActionModeRecording=true and fired onActionModeStart
    // before we ran. If a prior session is still busy we cannot start, but we
    // must still release main's lock — otherwise it stays stuck true and every
    // future action-mode AND dictation shortcut is swallowed until restart.
    if (phaseRef.current !== "idle") {
      window.api.actionMode.cancel();
      return;
    }

    const micGranted = await requestMicrophoneAccess();
    if (!micGranted) {
      playUiSound("error");
      showFeedback({
        kind: "generic",
        reason: m.pill_mic_permission_required(),
        action: {
          label: m.pill_mic_permission_action(),
          onClick: () => window.api.settings.openMicrophonePrivacy(),
        },
      });
      window.api.actionMode.cancel();
      return;
    }

    try {
      await capture.startRecording();
      window.api.actionMode.notifyStarted();
      updatePhase("recording");
      playUiSound("start");
    } catch {
      abortToIdle();
    }
  }, [abortToIdle, capture, showFeedback, updatePhase]);

  const stop = useCallback(async () => {
    if (phaseRef.current !== "recording") return;
    playUiSound("stop");
    updatePhase("processing");
    try {
      await capture.stopRecording();
    } catch {
      abortToIdle();
    }
  }, [abortToIdle, capture, updatePhase]);

  const cancel = useCallback(async () => {
    if (phaseRef.current === "idle") return;
    isCancellingRef.current = true;
    playUiSound("cancel");
    try {
      await capture.stopRecording();
    } catch {
      isCancellingRef.current = false;
      abortToIdle();
    }
    if (isCancellingRef.current) {
      isCancellingRef.current = false;
      abortToIdle();
    }
  }, [abortToIdle, capture]);

  return {
    phase,
    isSpeaking: capture.isSpeaking,
    volumeLevel: capture.volumeLevel,
    waveformHistory: capture.waveformHistory,
    start,
    stop,
    cancel,
  };
}
