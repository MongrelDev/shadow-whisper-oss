import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { useAuthContext } from "@/hooks/use-auth-context";
import {
  useRecordingSession,
  type UseRecordingSessionReturn,
} from "../hooks/use-recording-session";
import { useTranscriptionPersistence } from "../hooks/use-transcription-persistence";
import { useTranscriptionSettings } from "../hooks/use-transcription-settings";
import { useSessionRewardsSync } from "@/features/progress/stats/hooks/use-session-rewards-sync";
import { submitTranscription } from "../hooks/use-agent-transcription";
import { usePillStore } from "../stores/pill-store";

interface RecordingSessionContextValue {
  session: UseRecordingSessionReturn;
  lastError: string | null;
  clearLastError: () => void;
}

const RecordingSessionContext = createContext<RecordingSessionContextValue | null>(null);

export function RecordingSessionProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const navigate = useNavigate();
  const { userId } = useAuthContext();
  const { language } = useTranscriptionSettings();
  const { handleComplete, handleCancel, persistCapturedAudio, playSound } =
    useTranscriptionPersistence();
  const { showFeedback } = usePillStore();
  const [lastError, setLastError] = useState<string | null>(null);
  useSessionRewardsSync();

  const goMinimized = useCallback(
    () => void navigate({ to: "/pill", search: { view: "minimized" } }),
    [navigate]
  );

  const finishSessionRef = useRef<UseRecordingSessionReturn["finishSession"] | undefined>(
    undefined
  );
  const failSessionRef = useRef<UseRecordingSessionReturn["failSession"] | undefined>(undefined);

  const onTranscriptionNeeded = useCallback(
    (serverSessionId: string, audioBlob: Blob, localSessionId: number) => {
      void submitTranscription(
        { audioBlob, localSessionId, serverSessionId },
        {
          onComplete: (result) => finishSessionRef.current?.(result),
          onError: (code) => failSessionRef.current?.(code),
          onLimitReached: () => failSessionRef.current?.("er_limit_exceeded"),
        }
      );
    },
    []
  );

  const session = useRecordingSession({
    userId,
    language,
    onComplete: (result) => {
      void handleComplete(result);
    },
    onCancel: (audioBlob) => {
      void handleCancel(audioBlob);
    },
    onAudioCaptured: persistCapturedAudio,
    onTranscriptionNeeded,
    onSilenceDetected: () => {
      playSound("error");
      showFeedback({
        kind: "generic",
        reason: m.pill_transcription_no_audio_detected(),
      });
      goMinimized();
      window.api.recording.cancel();
    },
    onError: (error) => {
      setLastError(error.message);
      console.error("[PillPage] error:", error);
      playSound("error");
      goMinimized();
      window.api.recording.cancel();

      if (error.name === "NotAllowedError") {
        showFeedback({
          kind: "generic",
          reason: m.pill_mic_permission_required(),
          action: {
            label: m.pill_mic_permission_action(),
            onClick: () => window.api.settings.openMicrophonePrivacy(),
          },
        });
        return;
      }

      if (error.name === "NotFoundError") {
        showFeedback({
          kind: "generic",
          reason: m.pill_mic_not_found(),
        });
      }
    },
  });

  finishSessionRef.current = session.finishSession;
  failSessionRef.current = session.failSession;

  const value = useMemo<RecordingSessionContextValue>(
    () => ({
      session,
      lastError,
      clearLastError: () => setLastError(null),
    }),
    [lastError, session]
  );

  return (
    <RecordingSessionContext.Provider value={value}>{children}</RecordingSessionContext.Provider>
  );
}

export function useRecordingSessionContext(): RecordingSessionContextValue {
  const context = useContext(RecordingSessionContext);

  if (!context) {
    throw new Error("useRecordingSessionContext must be used within RecordingSessionProvider");
  }

  return context;
}
