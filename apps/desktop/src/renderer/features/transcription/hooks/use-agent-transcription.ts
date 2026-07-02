import { postTranscribeSync } from "../lib/transcribe-sync-client";
import type { TranscribeSyncIpcResult } from "../../../../shared/ipc-types";
import { getLocale } from "~/paraglide/runtime";

const TRANSCRIPTION_TIMEOUT_MS = 90_000;

export interface SubmitTranscriptionInput {
  audioBlob: Blob;
  localSessionId: number;
  serverSessionId: string;
}

export interface SubmitTranscriptionCallbacks {
  onComplete: (result: {
    text: string;
    raw: string;
    durationSeconds: number;
    sessionId: number;
  }) => void;
  onError: (error: string) => void;
  onLimitReached: () => void;
}

function withTimeout<T>(promise: Promise<T>, ms: number, reason: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(reason)), ms)),
  ]);
}

async function sendTranscribe(
  audioBlob: Blob,
  serverSessionId: string
): Promise<TranscribeSyncIpcResult> {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  const language = getLocale() ?? null;
  return postTranscribeSync({
    sessionId: serverSessionId,
    audioBlob,
    timezone,
    language,
    platform: "desktop",
    surfaceContext: null,
  });
}

function handleSuccess(
  result: Extract<TranscribeSyncIpcResult, { ok: true }>,
  localSessionId: number,
  callbacks: SubmitTranscriptionCallbacks
): void {
  const text = result.improvedText || result.rawText;
  const durationSeconds = result.durationMs ? Math.round(result.durationMs / 1000) : 0;
  callbacks.onComplete({ text, raw: result.rawText, durationSeconds, sessionId: localSessionId });
}

function handleFailure(
  result: Extract<TranscribeSyncIpcResult, { ok: false }>,
  callbacks: SubmitTranscriptionCallbacks
): void {
  if (result.reason === "quota_exceeded") {
    callbacks.onLimitReached();
    return;
  }
  callbacks.onError(result.reason);
}

export async function submitTranscription(
  input: SubmitTranscriptionInput,
  callbacks: SubmitTranscriptionCallbacks
): Promise<void> {
  let result: TranscribeSyncIpcResult;
  try {
    result = await withTimeout(
      sendTranscribe(input.audioBlob, input.serverSessionId),
      TRANSCRIPTION_TIMEOUT_MS,
      "transcription_timeout"
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "send_failed";
    callbacks.onError(message);
    return;
  }

  if (result.ok) {
    handleSuccess(result, input.localSessionId, callbacks);
  } else {
    handleFailure(result, callbacks);
  }
}
