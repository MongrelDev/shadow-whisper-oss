import { db, type ExtensionTranscription } from "./db";

const HISTORY_LIMIT = 500;

export type ExtensionHistoryEntry = ExtensionTranscription;

export async function getExtensionHistory(): Promise<ExtensionHistoryEntry[]> {
  return db.transcriptions.orderBy("createdAt").reverse().limit(HISTORY_LIMIT).toArray();
}

export async function addExtensionHistoryEntry(input: {
  text: string;
  rawText: string;
  durationSeconds: number;
  sessionId: number;
}) {
  const formattedText = input.text.trim();
  if (!formattedText) return;

  await db.transcriptions.add({
    sessionId: input.sessionId,
    rawText: input.rawText.trim() || formattedText,
    formattedText,
    durationSeconds: input.durationSeconds,
    createdAt: new Date(),
  });
}

export async function deleteExtensionHistoryEntry(id: number) {
  await db.transcriptions.delete(id);
}
