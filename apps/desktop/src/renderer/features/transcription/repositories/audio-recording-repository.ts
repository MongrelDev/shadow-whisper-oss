import { db, type AudioRecording } from "@/lib/db";

const DEFAULT_RETENTION_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SaveAudioRecordingForSessionInput {
  userId: string | null | undefined;
  sessionId: number;
  audioBlob: Blob;
  retentionDays?: number;
}

export interface FindAudioRecordingBySessionInput {
  userId: string;
  sessionId: number;
}

export interface ReassignAudioRecordingSessionInput {
  userId: string;
  previousSessionId: number;
  nextSessionId: number;
}

export interface DeleteAudioRecordingBySessionInput {
  userId: string;
  sessionId: number;
}

export interface AudioRecordingRepository {
  saveForSession(input: SaveAudioRecordingForSessionInput): Promise<AudioRecording>;
  findBySession(input: FindAudioRecordingBySessionInput): Promise<AudioRecording | undefined>;
  reassignSession(input: ReassignAudioRecordingSessionInput): Promise<void>;
  deleteBySession(input: DeleteAudioRecordingBySessionInput): Promise<void>;
  deleteExpired(): Promise<number>;
}

function assertAuthenticatedUserId(userId: string | null | undefined): string {
  if (!userId || !userId.trim()) {
    throw new Error("Cannot persist audio without an authenticated user");
  }

  return userId;
}

function buildExpiryDate(retentionDays: number, createdAt: Date): Date {
  return new Date(createdAt.getTime() + retentionDays * DAY_MS);
}

export const audioRecordingRepository: AudioRecordingRepository = {
  async saveForSession({
    userId,
    sessionId,
    audioBlob,
    retentionDays = DEFAULT_RETENTION_DAYS,
  }: SaveAudioRecordingForSessionInput): Promise<AudioRecording> {
    const ownerUserId = assertAuthenticatedUserId(userId);

    const createdAt = new Date();
    const expiresAt = buildExpiryDate(retentionDays, createdAt);
    const mimeType = audioBlob.type || "application/octet-stream";

    const id = await db.audioRecordings.add({
      userId: ownerUserId,
      sessionId,
      mimeType,
      blob: audioBlob,
      createdAt,
      expiresAt,
    });

    return {
      id,
      userId: ownerUserId,
      sessionId,
      mimeType,
      blob: audioBlob,
      createdAt,
      expiresAt,
    };
  },

  async findBySession({
    userId,
    sessionId,
  }: FindAudioRecordingBySessionInput): Promise<AudioRecording | undefined> {
    return db.audioRecordings.where("[userId+sessionId]").equals([userId, sessionId]).first();
  },

  async reassignSession({
    userId,
    previousSessionId,
    nextSessionId,
  }: ReassignAudioRecordingSessionInput): Promise<void> {
    const audio = await db.audioRecordings
      .where("[userId+sessionId]")
      .equals([userId, previousSessionId])
      .first();

    if (!audio) return;

    await db.audioRecordings.update(audio.id, {
      sessionId: nextSessionId,
    });
  },

  async deleteBySession({ userId, sessionId }: DeleteAudioRecordingBySessionInput): Promise<void> {
    await db.audioRecordings.where("[userId+sessionId]").equals([userId, sessionId]).delete();
  },

  async deleteExpired(): Promise<number> {
    return db.audioRecordings.where("expiresAt").belowOrEqual(new Date()).delete();
  },
};
