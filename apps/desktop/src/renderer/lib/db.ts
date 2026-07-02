import Dexie, { type EntityTable } from "dexie";

export interface Transcription {
  id: number;
  userId: string;
  sessionId: number | null;
  rawText: string;
  formattedText: string;
  language: string;
  wordCount: number;
  durationSeconds: number;
  status?: "completed" | "cancelled";
  createdAt: Date;
}

export interface AudioRecording {
  id: number;
  userId: string;
  sessionId: number | null;
  mimeType: string;
  blob: Blob;
  createdAt: Date;
  expiresAt: Date;
}

const db = new Dexie("shadow-whisper") as Dexie & {
  transcriptions: EntityTable<Transcription, "id">;
  audioRecordings: EntityTable<AudioRecording, "id">;
};

db.version(1).stores({
  transcriptions: "++id, [userId+createdAt], userId, createdAt",
  audioRecordings: "++id, [userId+createdAt], [userId+sessionId], sessionId, expiresAt, createdAt",
});

export { db };
