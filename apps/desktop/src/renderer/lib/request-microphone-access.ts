import {
  releaseAudioStream,
  requestAudioStream,
} from "@/features/transcription/hooks/lib/audio-capture-stream";

export async function requestMicrophoneAccess(): Promise<boolean> {
  const permission = await window.api.settings.getMicrophonePermission();

  let stream: MediaStream | null = null;
  try {
    stream = await requestAudioStream();
    return true;
  } catch (error) {
    console.error("[microphone] renderer access request failed", error);
    if (permission.status === "denied" || permission.status === "restricted") {
      void window.api.settings.openMicrophonePrivacy();
    }
    return false;
  } finally {
    releaseAudioStream(stream);
  }
}
