import { describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { authedFetch, readJson, workerFetch } from "../setup/request";
import { createPendingSuggestionFor, findLearnedWordBySourceFor } from "../setup/user-data";

interface PendingSuggestion {
  id: string;
  feedbackId: string;
  original: string;
  replacement: string;
  context: string;
  selectedText: string;
  source: string;
  status: string;
  createdAt: number;
}

interface SuggestionsListResponse {
  suggestions: PendingSuggestion[];
}

async function seedSuggestion(userId: string, input: { original: string; replacement: string }) {
  return createPendingSuggestionFor(userId, {
    feedbackId: crypto.randomUUID(),
    original: input.original,
    replacement: input.replacement,
    context: "test context",
    selectedText: input.original,
    source: "teach",
    matchedSessionId: null,
    now: Date.now(),
  });
}

describe("suggestions routes", () => {
  describe("GET /suggestions/pending", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/suggestions/pending");
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("returns empty list for a fresh user", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-fresh@example.com" });
      const response = await authedFetch("/suggestions/pending", user.cookie);

      expect(response.status).toBe(200);
      const body = await readJson<SuggestionsListResponse>(response);
      expect(body.suggestions).toEqual([]);
    });

    it("returns seeded suggestions for a user", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-seeded@example.com" });

      await seedSuggestion(user.user.id, { original: "teh", replacement: "the" });
      await seedSuggestion(user.user.id, { original: "recieve", replacement: "receive" });

      const response = await authedFetch("/suggestions/pending", user.cookie);
      expect(response.status).toBe(200);
      const body = await readJson<SuggestionsListResponse>(response);

      expect(body.suggestions).toHaveLength(2);
      for (const s of body.suggestions) {
        expect(s.id).toBeTruthy();
        expect(s.feedbackId).toBeTruthy();
        expect(s.status).toBe("pending");
        expect(s.source).toBe("teach");
      }

      const originals = body.suggestions.map((s) => s.original);
      expect(originals).toContain("teh");
      expect(originals).toContain("recieve");
    });
  });

  describe("POST /suggestions/:id/accept", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/suggestions/fake-id/accept", { method: "POST" });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("returns 404 for nonexistent suggestion", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-accept-404@example.com" });
      const response = await authedFetch("/suggestions/nonexistent-id/accept", user.cookie, {
        method: "POST",
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_suggestion_not_found",
      });
    });

    it("accepts a seeded suggestion and removes it from pending", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-accept-ok@example.com" });
      const row = await seedSuggestion(user.user.id, {
        original: "writting",
        replacement: "writing",
      });

      const acceptRes = await authedFetch(`/suggestions/${row.id}/accept`, user.cookie, {
        method: "POST",
      });
      expect(acceptRes.status).toBe(200);
      await expect(acceptRes.json()).resolves.toMatchObject({ success: true });

      const listRes = await authedFetch("/suggestions/pending", user.cookie);
      const body = await readJson<SuggestionsListResponse>(listRes);
      expect(body.suggestions).toHaveLength(0);
    });

    it("accepting a suggestion creates a learned word", async () => {
      const user = await createAuthenticatedUser({
        email: "suggestions-accept-learned@example.com",
      });
      const row = await seedSuggestion(user.user.id, { original: "coffe", replacement: "coffee" });

      const acceptRes = await authedFetch(`/suggestions/${row.id}/accept`, user.cookie, {
        method: "POST",
      });
      expect(acceptRes.status).toBe(200);

      const learnedWord = await findLearnedWordBySourceFor(user.user.id, "coffe");
      expect(learnedWord).not.toBeNull();
      expect(learnedWord!.replacement).toBe("coffee");
    });
  });

  describe("POST /suggestions/:id/reject", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/suggestions/fake-id/reject", { method: "POST" });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("returns 404 for nonexistent suggestion", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-reject-404@example.com" });
      const response = await authedFetch("/suggestions/nonexistent-id/reject", user.cookie, {
        method: "POST",
      });

      expect(response.status).toBe(404);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_suggestion_not_found",
      });
    });

    it("rejects a seeded suggestion and removes it from pending", async () => {
      const user = await createAuthenticatedUser({ email: "suggestions-reject-ok@example.com" });
      const row = await seedSuggestion(user.user.id, {
        original: "definately",
        replacement: "definitely",
      });

      const rejectRes = await authedFetch(`/suggestions/${row.id}/reject`, user.cookie, {
        method: "POST",
      });
      expect(rejectRes.status).toBe(200);
      await expect(rejectRes.json()).resolves.toMatchObject({ success: true });

      const listRes = await authedFetch("/suggestions/pending", user.cookie);
      const body = await readJson<SuggestionsListResponse>(listRes);
      expect(body.suggestions).toHaveLength(0);
    });

    it("rejecting a suggestion does NOT create a learned word", async () => {
      const user = await createAuthenticatedUser({
        email: "suggestions-reject-nodict@example.com",
      });
      const row = await seedSuggestion(user.user.id, { original: "teh", replacement: "the" });

      const rejectRes = await authedFetch(`/suggestions/${row.id}/reject`, user.cookie, {
        method: "POST",
      });
      expect(rejectRes.status).toBe(200);

      const learnedWord = await findLearnedWordBySourceFor(user.user.id, "teh");
      expect(learnedWord).toBeNull();
    });
  });
});
