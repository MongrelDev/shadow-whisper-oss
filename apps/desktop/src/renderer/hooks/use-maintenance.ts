import { useEffect } from "react";
import { audioRecordingRepository } from "@/features/transcription/repositories/audio-recording-repository";

export function useMaintenance(): void {
  useEffect(() => {
    const runCleanup = () => {
      void audioRecordingRepository.deleteExpired().catch((error) => {
        console.warn("[maintenance] Failed to delete expired audio", error);
      });
    };

    runCleanup();
    return window.api.maintenance.onCleanupExpiredAudio(runCleanup);
  }, []);
}
