import { db, type Transcription } from "@/lib/db";
import { audioRecordingRepository } from "@/features/transcription/repositories/audio-recording-repository";

function getAudioFilename(mimeType: string, sessionId: number): string {
  if (mimeType.includes("webm")) return `shadowwhisper-session-${sessionId}.webm`;
  if (mimeType.includes("mpeg") || mimeType.includes("mp3"))
    return `shadowwhisper-session-${sessionId}.mp3`;
  if (mimeType.includes("wav")) return `shadowwhisper-session-${sessionId}.wav`;
  return `shadowwhisper-session-${sessionId}.audio`;
}

export async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text);
}

export async function downloadEntryAudio(entry: Transcription): Promise<boolean> {
  if (entry.sessionId == null) return false;

  const audio = await audioRecordingRepository.findBySession({
    userId: entry.userId,
    sessionId: entry.sessionId,
  });
  if (!audio) return false;

  const url = URL.createObjectURL(audio.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getAudioFilename(audio.mimeType, entry.sessionId);
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

export async function deleteHistoryEntry(entry: Transcription): Promise<void> {
  if (entry.sessionId != null) {
    await audioRecordingRepository.deleteBySession({
      userId: entry.userId,
      sessionId: entry.sessionId,
    });
  }

  await db.transcriptions.delete(entry.id);
}
