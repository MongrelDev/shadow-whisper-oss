import Dexie, { type EntityTable } from "dexie";

export interface ExtensionTranscription {
  id: number;
  sessionId: number | null;
  rawText: string;
  formattedText: string;
  durationSeconds: number;
  createdAt: Date;
}

const db = new Dexie("shadow-whisper-extension") as Dexie & {
  transcriptions: EntityTable<ExtensionTranscription, "id">;
};

db.version(1).stores({
  transcriptions: "++id, createdAt, sessionId",
});

export { db };
