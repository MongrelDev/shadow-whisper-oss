import type { SurfaceContext, TranscribeSyncIpcResult } from "../../../../shared/ipc-types";

export interface PostTranscribeInput {
  sessionId: string;
  audioBlob: Blob;
  locale?: string;
  timezone: string;
  language: string | null;
  platform: "desktop";
  surfaceContext: SurfaceContext | null;
}

export async function postTranscribeSync(
  input: PostTranscribeInput
): Promise<TranscribeSyncIpcResult> {
  const buffer = await input.audioBlob.arrayBuffer();
  const contentType = input.audioBlob.type || "audio/webm";
  return window.api.session.transcribe({
    sessionId: input.sessionId,
    audioBuffer: buffer,
    contentType,
    locale: input.locale,
    timezone: input.timezone,
    language: input.language,
    platform: input.platform,
    surfaceContext: input.surfaceContext,
  });
}
