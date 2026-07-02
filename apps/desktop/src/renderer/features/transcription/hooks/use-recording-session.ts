import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioCapture, type RecordingCompleteMeta } from "./use-audio-capture";
import { useWarmupSession } from "./use-warmup-session";
import { useConfig } from "@/hooks/use-config";
import { useInteractionMode } from "@/providers/interaction-mode-provider";
import { usePillStore } from "../stores/pill-store";

export type SessionPhase = "idle" | "connecting" | "recording" | "processing";

export interface ActiveSession {
  sessionId: string;
  audioBlob: Blob;
  localSessionId: number;
}

export interface RecordingCompletionResult {
  sessionId: number;
  text: string;
  raw: string;
  durationSeconds: number;
  hadSpeechActivity: boolean;
}

export interface UseRecordingSessionOptions {
  userId: string | null;
  language: string;
  onComplete: (result: RecordingCompletionResult) => void;
  onCancel?: (audioBlob: Blob) => void;
  onAudioCaptured?: (sessionId: number, audioBlob: Blob) => void;
  onTranscriptionNeeded: (serverSessionId: string, audioBlob: Blob, localSessionId: number) => void;
  onSilenceDetected?: () => void;
  onError: (error: Error) => void;
}

export interface UseRecordingSessionReturn {
  phase: SessionPhase;
  isSpeaking: boolean;
  volumeLevel: number;
  waveformHistory: number[];
  start: () => Promise<boolean>;
  stop: () => Promise<void>;
  cancel: () => Promise<void>;
  activeSession: ActiveSession | null;
  finishSession: (result: {
    text: string;
    raw: string;
    durationSeconds: number;
    sessionId: number;
  }) => void;
  failSession: (errorCode: string) => void;
}

const RECORDING_SESSION_OWNER = "recording-session";

const INTERACTION_MODE_BY_PHASE = {
  idle: null,
  connecting: "recording-audio",
  recording: "recording-audio",
  processing: "processing-transcription",
} as const;

export function useRecordingSession(
  options: UseRecordingSessionOptions
): UseRecordingSessionReturn {
  const [phase, setPhase] = useState<SessionPhase>("idle");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const { config } = useConfig();
  const interactionMode = useInteractionMode();
  const inputDeviceId = config.preferences.audio.inputDeviceId;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const phaseRef = useRef<SessionPhase>(phase);
  phaseRef.current = phase;
  const activeSessionRef = useRef<ActiveSession | null>(activeSession);
  activeSessionRef.current = activeSession;

  const isCancellingRef = useRef(false);
  const pendingWarmupRef = useRef<{ sessionId: string } | null>(null);

  const updatePhase = useCallback((nextPhase: SessionPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const updateActiveSession = useCallback((nextSession: ActiveSession | null) => {
    activeSessionRef.current = nextSession;
    setActiveSession(nextSession);
  }, []);

  const setIdle = useCallback(() => updatePhase("idle"), [updatePhase]);
  const setProcessing = useCallback(() => updatePhase("processing"), [updatePhase]);

  const triggerLimit = usePillStore((s) => s.triggerLimit);
  const { warmup } = useWarmupSession();

  const beginProcessing = useCallback(
    (audioBlob: Blob, sessionId: string) => {
      setProcessing();
      const localSessionId = Date.now();
      updateActiveSession({ sessionId, audioBlob, localSessionId });
      optionsRef.current.onAudioCaptured?.(localSessionId, audioBlob);
      optionsRef.current.onTranscriptionNeeded(sessionId, audioBlob, localSessionId);
    },
    [setProcessing, updateActiveSession]
  );

  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob, meta: RecordingCompleteMeta) => {
      if (isCancellingRef.current) {
        isCancellingRef.current = false;
        updateActiveSession(null);
        pendingWarmupRef.current = null;
        setIdle();
        optionsRef.current.onCancel?.(audioBlob);
        return;
      }

      const warmupData = pendingWarmupRef.current;
      pendingWarmupRef.current = null;
      if (!warmupData) {
        setIdle();
        optionsRef.current.onError(new Error("no_active_session"));
        return;
      }

      if (!meta.hadSpeechActivity) {
        updateActiveSession(null);
        setIdle();
        optionsRef.current.onSilenceDetected?.();
        return;
      }

      beginProcessing(audioBlob, warmupData.sessionId);
    },
    [beginProcessing, setIdle, updateActiveSession]
  );

  const handleCaptureError = useCallback(
    (error: Error) => {
      updateActiveSession(null);
      pendingWarmupRef.current = null;
      setIdle();
      optionsRef.current.onError(error);
    },
    [setIdle, updateActiveSession]
  );

  const capture = useAudioCapture({
    deviceId: typeof inputDeviceId === "string" ? inputDeviceId : undefined,
    onRecordingComplete: handleRecordingComplete,
    onError: handleCaptureError,
  });

  useEffect(() => {
    const mode = INTERACTION_MODE_BY_PHASE[phase];

    if (mode) {
      void interactionMode.setMode(mode, RECORDING_SESSION_OWNER);
      return;
    }

    void interactionMode.clearMode(RECORDING_SESSION_OWNER);
  }, [interactionMode, phase]);

  useEffect(() => {
    return () => {
      void interactionMode.clearMode(RECORDING_SESSION_OWNER);
    };
  }, [interactionMode]);

  const isBusy = (): boolean =>
    phaseRef.current !== "idle" ||
    activeSessionRef.current !== null ||
    pendingWarmupRef.current !== null;

  const handleWarmupFailure = (reason: string): false => {
    setIdle();
    if (reason === "quota_exceeded") {
      triggerLimit();
      return false;
    }
    optionsRef.current.onError(new Error(reason));
    return false;
  };

  const start = async (): Promise<boolean> => {
    if (isBusy()) return false;

    updatePhase("connecting");
    try {
      const result = await warmup();
      if (!result.ok) return handleWarmupFailure(result.reason);

      // If the phase changed while warmup was in flight (e.g. stop/cancel
      // was called), abort instead of starting recording.
      if (phaseRef.current !== "connecting") {
        pendingWarmupRef.current = null;
        updateActiveSession(null);
        setIdle();
        return false;
      }

      pendingWarmupRef.current = { sessionId: result.sessionId };
      await capture.startRecording();
      window.api.recording.notifyStarted();
      updatePhase("recording");
      return true;
    } catch (err) {
      pendingWarmupRef.current = null;
      updateActiveSession(null);
      setIdle();
      await capture.stopRecording().catch(() => undefined);
      optionsRef.current.onError(
        err instanceof Error ? err : new Error("Failed to start recording")
      );
      return false;
    }
  };

  const stop = async () => {
    setProcessing();
    try {
      await capture.stopRecording();
    } catch (err) {
      updateActiveSession(null);
      pendingWarmupRef.current = null;
      setIdle();
      optionsRef.current.onError(
        err instanceof Error ? err : new Error("Failed to stop recording")
      );
    }
  };

  const cancel = async () => {
    isCancellingRef.current = true;
    try {
      await capture.stopRecording();
    } catch {
      isCancellingRef.current = false;
      updateActiveSession(null);
      pendingWarmupRef.current = null;
      setIdle();
    }
    // If VAD hadn't started yet, stopRecording() returns early without
    // calling onRecordingComplete, so handleRecordingComplete never fires
    // to reset isCancellingRef. Clean up manually.
    if (isCancellingRef.current) {
      isCancellingRef.current = false;
      updateActiveSession(null);
      pendingWarmupRef.current = null;
      setIdle();
    }
  };

  const finishSession = useCallback(
    (result: { text: string; raw: string; durationSeconds: number; sessionId: number }) => {
      updateActiveSession(null);
      setIdle();
      optionsRef.current.onComplete({
        ...result,
        hadSpeechActivity: capture.hadSpeechActivity,
      });
    },
    [capture.hadSpeechActivity, setIdle, updateActiveSession]
  );

  const failSession = useCallback(
    (errorCode: string) => {
      updateActiveSession(null);
      setIdle();
      if (errorCode === "limit_exceeded" || errorCode === "er_limit_exceeded") {
        triggerLimit();
        return;
      }
      optionsRef.current.onError(new Error(errorCode));
    },
    [setIdle, triggerLimit, updateActiveSession]
  );

  return {
    phase,
    isSpeaking: capture.isSpeaking,
    volumeLevel: capture.volumeLevel,
    waveformHistory: capture.waveformHistory,
    start,
    stop,
    cancel,
    activeSession,
    finishSession,
    failSession,
  };
}
