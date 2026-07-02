import { useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { m } from "~/paraglide/messages";
import type { Transcription } from "@/lib/db";
import { db } from "@/lib/db";
import { fetchSessionUser } from "@/lib/auth-session";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useConfig } from "@/hooks/use-config";
import { playUiSound, preloadUiSounds } from "@/lib/ui-sounds";
import { useTranscriptionSettings } from "./use-transcription-settings";
import { audioRecordingRepository } from "../repositories/audio-recording-repository";
import { usePillStore } from "../stores/pill-store";
import { isEligibleForCleanupDiff } from "../lib/diff-helpers";
import { useEffect } from "react";

const CLEANUP_DIFF_GATE_MS = 24 * 60 * 60 * 1000;

export interface RecordingCompletionResult {
  sessionId: number;
  text: string;
  raw: string;
  durationSeconds: number;
  hadSpeechActivity: boolean;
}

async function resolveSessionUserId(
  userId: string | null,
  queryClient: ReturnType<typeof useQueryClient>
): Promise<string> {
  if (userId != null) return userId;

  const resolvedUser = await queryClient.fetchQuery({
    queryKey: ["auth", "session"],
    queryFn: fetchSessionUser,
    staleTime: 60_000,
  });

  return resolvedUser?.id ?? "";
}

function buildCompletedTranscription(
  result: RecordingCompletionResult,
  userId: string,
  language: string
) {
  return {
    userId,
    sessionId: result.sessionId,
    rawText: result.raw ?? "",
    formattedText: result.text ?? "",
    language,
    wordCount: result.text ? result.text.split(/\s+/).filter(Boolean).length : 0,
    durationSeconds: result.durationSeconds,
    createdAt: new Date(),
  } satisfies Omit<Transcription, "id">;
}

function isCleanupDiffDailyGatePassed(lastShownAt: string | null): boolean {
  if (lastShownAt === null) return true;
  return Date.now() - new Date(lastShownAt).getTime() > CLEANUP_DIFF_GATE_MS;
}

function triggerCleanupDiffNudge(
  config: ReturnType<typeof useConfig>["config"],
  rawText: string,
  formattedText: string,
  setCleanupDiffNudge: (rawText: string, formattedText: string) => void
): void {
  if (!isEligibleForCleanupDiff(rawText, formattedText)) return;
  if (!isCleanupDiffDailyGatePassed(config.nudges.cleanupDiff.lastShownAt)) return;

  const now = new Date().toISOString();
  const patch: Parameters<typeof window.api.config.set>[0] = {
    nudges: {
      cleanupDiff: {
        lastShownAt: now,
        timesShown: config.nudges.cleanupDiff.timesShown + 1,
        ...(config.nudges.cleanupDiff.eligibleAt === null ? { eligibleAt: now } : {}),
      },
    },
  };
  void window.api.config.set(patch);
  setCleanupDiffNudge(rawText, formattedText);
}

function incrementSkillDiscoveryCount(config: ReturnType<typeof useConfig>["config"]): void {
  const current = config.nudges.skillDiscovery;
  const newCount = current.successfulTranscriptionCount + 1;
  const patch: Parameters<typeof window.api.config.set>[0] = {
    nudges: {
      skillDiscovery: {
        successfulTranscriptionCount: newCount,
        ...(newCount >= 5 && current.eligibleAt === null
          ? { eligibleAt: new Date().toISOString() }
          : {}),
      },
    },
  };
  void window.api.config.set(patch);
}

async function shouldPersistAudio(
  appConfig: ReturnType<typeof useConfig>["config"]
): Promise<boolean> {
  const freshConfig = await window.api.config.get();
  if (freshConfig.success && freshConfig.data) {
    return freshConfig.data.preferences.audio.localAudioRetention !== false;
  }
  return appConfig.preferences.audio.localAudioRetention !== false;
}

export interface UseTranscriptionPersistenceReturn {
  handleComplete: (result: RecordingCompletionResult) => Promise<void>;
  handleCancel: (audioBlob: Blob) => Promise<void>;
  persistCapturedAudio: (sessionId: number, audioBlob: Blob) => void;
  playSound: (sound: Parameters<typeof playUiSound>[0]) => void;
}

export function useTranscriptionPersistence(): UseTranscriptionPersistenceReturn {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { userId } = useAuthContext();
  const { config: appConfig } = useConfig();
  const { language } = useTranscriptionSettings();
  const { setLastCompleted, showFeedback, setCleanupDiffNudge } = usePillStore();
  const uiSoundsEnabled = appConfig.preferences.audio.enableSounds;

  useEffect(() => {
    if (uiSoundsEnabled) preloadUiSounds();
  }, [uiSoundsEnabled]);

  const playSound = useCallback(
    (sound: Parameters<typeof playUiSound>[0]) => {
      if (uiSoundsEnabled) playUiSound(sound);
    },
    [uiSoundsEnabled]
  );

  const goMinimized = useCallback(
    () => void navigate({ to: "/pill", search: { view: "minimized" } }),
    [navigate]
  );

  const handleComplete = useCallback(
    async (result: RecordingCompletionResult) => {
      if (!result.text.trim()) {
        playSound("error");
        showFeedback({
          kind: "generic",
          reason: result.hadSpeechActivity
            ? m.pill_transcription_unable_to_transcribe()
            : m.pill_transcription_no_audio_detected(),
        });
        goMinimized();
        return;
      }

      const response = await window.api.transcription.insert(result.text);
      const insertNotice = response.notice;

      const resolvedUserId = await resolveSessionUserId(userId, queryClient);
      const transcription = buildCompletedTranscription(result, resolvedUserId, language);

      setLastCompleted({ id: 0, ...transcription });

      if (transcription.userId) {
        await db.transcriptions.add(transcription);
      }

      if (!insertNotice) {
        incrementSkillDiscoveryCount(appConfig);
        triggerCleanupDiffNudge(
          appConfig,
          transcription.rawText,
          transcription.formattedText,
          setCleanupDiffNudge
        );
      }

      goMinimized();
      if (insertNotice) {
        playSound("error");
        showFeedback({ kind: "generic", reason: insertNotice });
      }
    },
    [
      appConfig,
      goMinimized,
      language,
      playSound,
      queryClient,
      setCleanupDiffNudge,
      setLastCompleted,
      showFeedback,
      userId,
    ]
  );

  const handleCancel = useCallback(
    async (audioBlob: Blob) => {
      const localSessionId = -Date.now();
      const resolvedUserId = await resolveSessionUserId(userId, queryClient);
      if (!resolvedUserId) {
        goMinimized();
        return;
      }

      const shouldSave = await shouldPersistAudio(appConfig);

      if (shouldSave && audioBlob.size > 0) {
        await audioRecordingRepository
          .saveForSession({
            userId: resolvedUserId,
            sessionId: localSessionId,
            audioBlob,
          })
          .catch((error) => {
            console.warn("[useTranscriptionPersistence] Failed to persist cancelled audio", error);
          });
      }

      await db.transcriptions.add({
        userId: resolvedUserId,
        sessionId: localSessionId,
        rawText: "",
        formattedText: "",
        language,
        wordCount: 0,
        durationSeconds: 0,
        status: "cancelled",
        createdAt: new Date(),
      });

      goMinimized();
    },
    [appConfig, goMinimized, language, queryClient, userId]
  );

  const persistCapturedAudio = useCallback(
    (sessionId: number, audioBlob: Blob) => {
      void (async () => {
        const shouldSave = await shouldPersistAudio(appConfig);
        if (!shouldSave || audioBlob.size === 0) return;

        const resolvedUserId = await resolveSessionUserId(userId, queryClient);
        await audioRecordingRepository
          .saveForSession({ userId: resolvedUserId, sessionId, audioBlob })
          .catch((error) => {
            console.warn("[useTranscriptionPersistence] Failed to persist captured audio", error);
          });
      })();
    },
    [appConfig, queryClient, userId]
  );

  return { handleComplete, handleCancel, persistCapturedAudio, playSound };
}
