import { afterEach, describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { insertTestSubscription } from "../setup/db";
import { TestSpeechToTextLive } from "../setup/ai-layers";
import { _testRuntime } from "../../src/modules/whisper-session/runtime";
import { authedFetch, authedJson, readJson, workerFetch, workerJson } from "../setup/request";

interface WarmupResponse {
  sessionId: string;
}

interface TranscribeResponse {
  sessionId: string;
  rawText: string;
  improvedText: string;
  sttEngine: string;
  durationMs: number;
}

describe("whisper-session routes", () => {
  afterEach(() => {
    _testRuntime.reset();
  });

  describe("POST /api/sessions/warmup", () => {
    it("rejects anonymous access", async () => {
      const response = await workerJson("/api/sessions/warmup", {
        method: "POST",
        json: {},
      });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("warms up a session for an authenticated user with subscription", async () => {
      const user = await createAuthenticatedUser({
        email: "session-warmup@example.com",
        stripeCustomerId: "cus_warmup",
      });
      await insertTestSubscription({
        referenceId: user.user.id,
        stripeCustomerId: "cus_warmup",
        status: "active",
        plan: "pro",
      });

      const response = await authedJson("/api/sessions/warmup", user.cookie, {
        method: "POST",
        json: {},
      });

      expect(response.status).toBe(200);
      const body = await readJson<WarmupResponse>(response);
      expect(body.sessionId).toBeTruthy();
      expect(typeof body.sessionId).toBe("string");
    });

    it("accepts appContext in warmup body", async () => {
      const user = await createAuthenticatedUser({
        email: "session-warmup-ctx@example.com",
        stripeCustomerId: "cus_warmup_ctx",
      });
      await insertTestSubscription({
        referenceId: user.user.id,
        stripeCustomerId: "cus_warmup_ctx",
        status: "active",
        plan: "pro",
      });

      const response = await authedJson("/api/sessions/warmup", user.cookie, {
        method: "POST",
        json: {
          appContext: {
            bundleId: "com.test.app",
            host: "example.com",
          },
        },
      });

      expect(response.status).toBe(200);
      const body = await readJson<WarmupResponse>(response);
      expect(body.sessionId).toBeTruthy();
    });
  });

  describe("POST /api/sessions/:sessionId/transcribe", () => {
    it("rejects anonymous access", async () => {
      const response = await workerFetch("/api/sessions/some-session-id/transcribe", {
        method: "POST",
      });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("rejects requests without audio form field", async () => {
      const user = await createAuthenticatedUser({ email: "session-no-audio@example.com" });
      const form = new FormData();
      form.append("locale", "en-US");

      const response = await authedFetch("/api/sessions/test-session/transcribe", user.cookie, {
        method: "POST",
        body: form,
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_validation",
      });
    });

    it("rejects non-multipart body", async () => {
      const user = await createAuthenticatedUser({ email: "session-no-multipart@example.com" });
      const response = await authedFetch("/api/sessions/test-session/transcribe", user.cookie, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ audio: "not-a-blob" }),
      });

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_validation",
      });
    });

    // STT now runs inside the WhisperAgent, which rebuilds its layer per
    // runSession and reads the fake engine fresh each call (no premature
    // memoization), so the override reliably reaches the agent path.
    it("transcribes audio with test SpeechToText layer and returns structured response", async () => {
      _testRuntime.setOverrides({
        speechToTextLayer: TestSpeechToTextLive({ text: "hello world test" }),
      });

      const user = await createAuthenticatedUser({
        email: "session-transcribe-happy@example.com",
        stripeCustomerId: "cus_transcribe_happy",
      });
      await insertTestSubscription({
        referenceId: user.user.id,
        stripeCustomerId: "cus_transcribe_happy",
        status: "active",
        plan: "pro",
      });

      const warmupRes = await authedJson("/api/sessions/warmup", user.cookie, {
        method: "POST",
        json: {},
      });
      expect(warmupRes.status).toBe(200);
      const { sessionId } = await readJson<WarmupResponse>(warmupRes);

      const audio = new Blob([new Uint8Array(64)], { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", audio);
      form.append("locale", "auto");
      form.append("platform", "desktop");

      const response = await authedFetch(`/api/sessions/${sessionId}/transcribe`, user.cookie, {
        method: "POST",
        body: form,
      });

      expect(response.status).toBe(200);
      const body = await readJson<TranscribeResponse>(response);
      expect(body.sessionId).toBe(sessionId);
      expect(body.rawText).toBe("hello world test");
      expect(body.sttEngine).toBe("whisper");
      expect(body.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof body.improvedText).toBe("string");
    });
  });
});
