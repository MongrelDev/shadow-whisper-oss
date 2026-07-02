import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { seedAppRegistryEntry } from "../setup/db";
import { authedFetch, readJson, workerFetch } from "../setup/request";
import { recordUsageFor } from "../setup/user-data";

interface DailyBreakdownResponse {
  from: string;
  to: string;
  items: Array<{
    localDate: string;
    platform: string;
    os: string;
    hostName: string;
    category: string;
    wordCount: number;
    durationMs: number;
    entryCount: number;
  }>;
  achievementDates: string[];
}

interface AchievementItem {
  key: string;
  earnedAt: number | null;
  contextJson: string | null;
  progress?: { current: number; target: number; label: string };
}

interface AchievementsResponse {
  items: AchievementItem[];
}

interface UserStatsResponse {
  currentStreak: number;
  weeklyAvgWpm: number;
  totalWords: number;
  isFirstWeek: boolean;
  hasAnyEntries: boolean;
  achievements: AchievementItem[];
  milestones: Array<{
    key: string;
    earnedAt: number | null;
    contextJson: string | null;
  }>;
}

function todayLocalDate(): string {
  return new Date().toISOString().slice(0, 10);
}

interface SeedUsageOverrides {
  wordCount?: number;
  durationMs?: number;
  platform?: "desktop" | "extension";
  bundleId?: string | null;
  siteHost?: string | null;
}

const SEED_DEFAULTS: Required<SeedUsageOverrides> = {
  wordCount: 150,
  durationMs: 5000,
  platform: "desktop",
  bundleId: null,
  siteHost: null,
};

async function seedUsageEntry(userId: string, overrides: SeedUsageOverrides = {}) {
  const opts = { ...SEED_DEFAULTS, ...overrides };
  return recordUsageFor(userId, {
    id: crypto.randomUUID(),
    wordCount: opts.wordCount,
    bundleId: opts.bundleId,
    siteHost: opts.siteHost,
    surfaceContext: "editor",
    enginesJson: JSON.stringify(["whisper"]),
    durationMs: opts.durationMs,
    createdAt: Date.now(),
    platform: opts.platform,
    os: "macos",
    language: "en",
    timezone: "UTC",
  });
}

describe("usage routes", () => {
  describe("GET /api/usage/daily", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/api/usage/daily?from=2026-01-01&to=2026-01-31");
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("rejects missing query params", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-missing@example.com" });
      const response = await authedFetch("/api/usage/daily", user.cookie);
      expect(response.status).toBe(400);
    });

    it("rejects invalid date format in 'from'", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-bad-from@example.com" });
      const response = await authedFetch(
        "/api/usage/daily?from=not-a-date&to=2026-01-31",
        user.cookie
      );
      expect(response.status).toBe(400);
    });

    it("rejects invalid date format in 'to'", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-bad-to@example.com" });
      const response = await authedFetch(
        "/api/usage/daily?from=2026-01-01&to=13-99-99",
        user.cookie
      );
      expect(response.status).toBe(400);
    });

    it("handles reversed date range gracefully", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-reversed@example.com" });
      const response = await authedFetch(
        "/api/usage/daily?from=2026-12-31&to=2026-01-01",
        user.cookie
      );
      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body.items).toEqual([]);
    });

    it("returns empty breakdown for a fresh user", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-fresh@example.com" });
      const response = await authedFetch(
        "/api/usage/daily?from=2026-01-01&to=2026-01-31",
        user.cookie
      );

      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body).toMatchObject({
        from: "2026-01-01",
        to: "2026-01-31",
        items: [],
        achievementDates: [],
      });
    });

    it("resolves known bundleId to its registered hostName", async () => {
      await seedAppRegistryEntry({
        identifier: "com.apple.mail",
        identifierType: "bundle",
        hostName: "Apple Mail",
        category: "email",
      });
      const user = await createAuthenticatedUser({ email: "usage-daily-bundle@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, {
        wordCount: 120,
        bundleId: "com.apple.mail",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body.items.length).toBe(1);

      const item = body.items[0]!;
      expect(item.wordCount).toBe(120);
      expect(item.hostName).toBe("Apple Mail");
      expect(item.category).toBe("email");
    });

    it("groups unknown bundleId as uncategorized", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-unknown@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, {
        wordCount: 80,
        bundleId: "com.unknown.app",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body.items.length).toBe(1);

      const item = body.items[0]!;
      expect(item.wordCount).toBe(80);
      expect(item.hostName).toBe("Outros");
    });

    it("resolves known siteHost to its registered hostName", async () => {
      await seedAppRegistryEntry({
        identifier: "mail.google.com",
        identifierType: "host",
        hostName: "Gmail",
        category: "email",
      });
      const user = await createAuthenticatedUser({ email: "usage-daily-host@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, {
        wordCount: 90,
        siteHost: "mail.google.com",
        platform: "extension",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body.items.length).toBe(1);

      const item = body.items[0]!;
      expect(item.wordCount).toBe(90);
      expect(item.hostName).toBe("Gmail");
      expect(item.category).toBe("email");
    });

    it("uses the site host when the focused app is a browser", async () => {
      await seedAppRegistryEntry({
        identifier: "com.google.chrome",
        identifierType: "bundle",
        hostName: "Chrome",
        category: "browser",
      });
      await seedAppRegistryEntry({
        identifier: "mail.google.com",
        identifierType: "host",
        hostName: "Gmail",
        category: "email",
      });
      const user = await createAuthenticatedUser({ email: "usage-daily-browser-host@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, {
        wordCount: 70,
        bundleId: "com.google.chrome",
        siteHost: "mail.google.com",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      const body = await readJson<DailyBreakdownResponse>(response);
      const item = body.items[0]!;
      expect(item.hostName).toBe("Gmail");
      expect(item.category).toBe("email");
    });

    it("lets a recognized site host win over the focused app", async () => {
      await seedAppRegistryEntry({
        identifier: "com.apple.mail",
        identifierType: "bundle",
        hostName: "Apple Mail",
        category: "email",
      });
      await seedAppRegistryEntry({
        identifier: "mail.google.com",
        identifierType: "host",
        hostName: "Gmail",
        category: "email",
      });
      const user = await createAuthenticatedUser({ email: "usage-daily-nonbrowser@example.com" });
      const today = todayLocalDate();

      // Site beats app: a host that exists in app_host_registry takes priority over the
      // focused app's own category. An unrecognized stray host would fall back to the app.
      await seedUsageEntry(user.user.id, {
        wordCount: 70,
        bundleId: "com.apple.mail",
        siteHost: "mail.google.com",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      const body = await readJson<DailyBreakdownResponse>(response);
      const item = body.items[0]!;
      expect(item.hostName).toBe("Gmail");
      expect(item.category).toBe("email");
    });

    it("falls back to the app entry for an unregistered site", async () => {
      await seedAppRegistryEntry({
        identifier: "com.google.chrome",
        identifierType: "bundle",
        hostName: "Chrome",
        category: "browser",
      });
      const user = await createAuthenticatedUser({ email: "usage-daily-unknownsite@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, {
        wordCount: 70,
        bundleId: "com.google.chrome",
        siteHost: "example.com",
      });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);
      const body = await readJson<DailyBreakdownResponse>(response);
      const item = body.items[0]!;
      expect(item.hostName).toBe("Chrome");
      expect(item.category).toBe("browser");
    });

    it("returns seeded entries in daily breakdown", async () => {
      const user = await createAuthenticatedUser({ email: "usage-daily-seeded@example.com" });
      const today = todayLocalDate();

      await seedUsageEntry(user.user.id, { wordCount: 200, durationMs: 8000 });
      await seedUsageEntry(user.user.id, { wordCount: 100, durationMs: 3000 });

      const response = await authedFetch(`/api/usage/daily?from=${today}&to=${today}`, user.cookie);

      expect(response.status).toBe(200);
      const body = await readJson<DailyBreakdownResponse>(response);
      expect(body.items.length).toBeGreaterThanOrEqual(1);

      const totalWords = body.items.reduce((sum, item) => sum + item.wordCount, 0);
      expect(totalWords).toBe(300);
    });
  });

  describe("GET /api/usage/achievements", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/api/usage/achievements");
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("returns achievements list for a fresh user", async () => {
      const user = await createAuthenticatedUser({ email: "usage-ach-fresh@example.com" });
      const response = await authedFetch("/api/usage/achievements", user.cookie);

      expect(response.status).toBe(200);
      const body = await readJson<AchievementsResponse>(response);
      expect(body.items).toBeInstanceOf(Array);
      for (const item of body.items) {
        expect(item).toHaveProperty("key");
        expect(item).toHaveProperty("earnedAt");
        expect(item.earnedAt).toBeNull();
      }
    });

    it("unlocks first_transcription after seeding a usage entry", async () => {
      const user = await createAuthenticatedUser({ email: "usage-ach-first@example.com" });

      await seedUsageEntry(user.user.id, { wordCount: 50 });

      const response = await authedFetch("/api/usage/achievements", user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<AchievementsResponse>(response);

      const firstTranscription = body.items.find((a) => a.key === "first_transcription");
      expect(firstTranscription).toBeDefined();
      expect(firstTranscription!.earnedAt).not.toBeNull();
    });
  });

  describe("GET /api/usage/stats", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/api/usage/stats");
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("returns zero stats for a fresh user", async () => {
      const user = await createAuthenticatedUser({ email: "usage-stats-fresh@example.com" });
      const response = await authedFetch("/api/usage/stats", user.cookie);

      expect(response.status).toBe(200);
      const body = await readJson<UserStatsResponse>(response);
      expect(body).toMatchObject({
        currentStreak: 0,
        totalWords: 0,
        hasAnyEntries: false,
        isFirstWeek: true,
      });
      expect(body.weeklyAvgWpm).toBeGreaterThanOrEqual(0);
      expect(body.achievements).toBeInstanceOf(Array);
      expect(body.milestones).toBeInstanceOf(Array);
    });

    it("reflects seeded usage in stats", async () => {
      const user = await createAuthenticatedUser({ email: "usage-stats-seeded@example.com" });

      await seedUsageEntry(user.user.id, { wordCount: 500, durationMs: 60000 });

      const response = await authedFetch("/api/usage/stats", user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<UserStatsResponse>(response);

      expect(body.totalWords).toBe(500);
      expect(body.hasAnyEntries).toBe(true);
      expect(body.currentStreak).toBeGreaterThanOrEqual(1);

      const firstTranscription = body.achievements.find((a) => a.key === "first_transcription");
      expect(firstTranscription).toBeDefined();
      expect(firstTranscription!.earnedAt).not.toBeNull();
    });
  });
});
