import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { authedFetch, readJson, workerFetch } from "../setup/request";
import { recordUsageFor } from "../setup/user-data";

interface ShareCardResponse {
  totalWords: number;
  totalDuration: number;
  totalTranscriptions: number;
  weeklyAvgWpm: number;
  currentStreak: number;
  maxStreak: number;
  memberSince: number | null;
  personalBestWpm: number;
  distinctSkillsAllTime: number;
  distinctLanguagesAllTime: number;
  achievements: Array<{ key: string; earnedAt: number | null }>;
  milestones: Array<{ key: string; earnedAt: number | null }>;
}

async function seedUsageEntry(
  userId: string,
  overrides: {
    wordCount?: number;
    durationMs?: number;
    language?: string;
    id?: string;
  } = {}
) {
  return recordUsageFor(userId, {
    id: overrides.id ?? crypto.randomUUID(),
    wordCount: overrides.wordCount ?? 150,
    bundleId: null,
    siteHost: null,
    surfaceContext: "editor",
    enginesJson: JSON.stringify(["whisper"]),
    durationMs: overrides.durationMs ?? 5000,
    createdAt: Date.now(),
    platform: "desktop",
    os: "macos",
    language: overrides.language ?? "en",
    timezone: "UTC",
  });
}

describe("GET /api/usage/share-card", () => {
  it("rejects anonymous access", async () => {
    const response = await workerFetch("/api/usage/share-card");
    expect(response.status).toBe(401);
  });

  it("returns zero stats for a fresh user", async () => {
    const user = await createAuthenticatedUser({ email: "share-card-fresh@example.com" });
    const response = await authedFetch("/api/usage/share-card", user.cookie);

    expect(response.status).toBe(200);
    const body = await readJson<ShareCardResponse>(response);
    expect(body.totalWords).toBe(0);
    expect(body.totalDuration).toBe(0);
    expect(body.totalTranscriptions).toBe(0);
    expect(body.currentStreak).toBe(0);
    expect(body.maxStreak).toBe(0);
    expect(body.memberSince).toBeNull();
    expect(body.personalBestWpm).toBe(0);
    expect(body.distinctSkillsAllTime).toBe(0);
    expect(body.distinctLanguagesAllTime).toBe(0);
    expect(body.achievements).toBeInstanceOf(Array);
    expect(body.milestones).toBeInstanceOf(Array);
  });

  it("reflects seeded usage in share card stats", async () => {
    const user = await createAuthenticatedUser({ email: "share-card-seeded@example.com" });

    await seedUsageEntry(user.user.id, { wordCount: 500, durationMs: 120_000 });
    await seedUsageEntry(user.user.id, { wordCount: 300, durationMs: 90_000 });

    const response = await authedFetch("/api/usage/share-card", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<ShareCardResponse>(response);

    expect(body.totalWords).toBe(800);
    expect(body.totalDuration).toBe(210_000);
    expect(body.totalTranscriptions).toBe(2);
    expect(body.currentStreak).toBe(1);
    expect(body.maxStreak).toBe(1);
    expect(body.memberSince).toBeTypeOf("number");
    expect(body.personalBestWpm).toBeGreaterThan(0);
    expect(body.distinctLanguagesAllTime).toBe(1);
  });

  it("tracks multiple languages", async () => {
    const user = await createAuthenticatedUser({ email: "share-card-multilang@example.com" });

    await seedUsageEntry(user.user.id, { wordCount: 100, language: "en" });
    await seedUsageEntry(user.user.id, { wordCount: 100, language: "pt-BR" });
    await seedUsageEntry(user.user.id, { wordCount: 100, language: "es" });

    const response = await authedFetch("/api/usage/share-card", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<ShareCardResponse>(response);

    expect(body.distinctLanguagesAllTime).toBe(3);
  });

  it("includes achievement and milestone state", async () => {
    const user = await createAuthenticatedUser({ email: "share-card-badges@example.com" });

    await seedUsageEntry(user.user.id, { wordCount: 200 });

    const response = await authedFetch("/api/usage/share-card", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<ShareCardResponse>(response);

    const firstTranscription = body.achievements.find((a) => a.key === "first_transcription");
    expect(firstTranscription).toBeDefined();
    expect(firstTranscription!.earnedAt).not.toBeNull();

    const milestone10k = body.milestones.find((m) => m.key === "milestone_10k");
    expect(milestone10k).toBeDefined();
    expect(milestone10k!.earnedAt).toBeNull();
  });

  it("replay does not double-count totalWords", async () => {
    const user = await createAuthenticatedUser({ email: "share-card-replay@example.com" });
    const entryId = crypto.randomUUID();

    await seedUsageEntry(user.user.id, { wordCount: 400, id: entryId });
    await seedUsageEntry(user.user.id, { wordCount: 400, id: entryId });

    const response = await authedFetch("/api/usage/share-card", user.cookie);
    expect(response.status).toBe(200);
    const body = await readJson<ShareCardResponse>(response);

    expect(body.totalWords).toBe(400);
    expect(body.totalTranscriptions).toBe(1);
  });
});
