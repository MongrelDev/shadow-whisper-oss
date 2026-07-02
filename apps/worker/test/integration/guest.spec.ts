import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { TestSpeechToTextLive, TestSkillExecutorLive } from "../setup/ai-layers";
import { GuestLive } from "../../src/modules/guest/infra/live";
import { GuestJobService } from "../../src/modules/guest/application/ports/guest-job-service";
import { NoopObservabilityLive } from "../../src/observability/observability";
import { BackgroundTasks } from "../../src/background/background-tasks";
import { readJson, workerFetch, workerJson } from "../setup/request";

// In-process integration runs the deferred completion synchronously so the
// assertion sees the persisted job without racing waitUntil.
const InlineBackgroundTasksLive = Layer.succeed(BackgroundTasks, {
  defer: (effect) => Effect.ignore(effect),
});

const TRUSTED_ORIGIN = "http://localhost:3001";

function guestFetch(path: string, init?: RequestInit & { cookie?: string }): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Origin", TRUSTED_ORIGIN);
  if (init?.cookie) headers.set("cookie", init.cookie);
  return workerFetch(path, { ...init, headers });
}

function guestJson(
  path: string,
  init?: Omit<RequestInit, "body"> & { json?: unknown; cookie?: string }
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Origin", TRUSTED_ORIGIN);
  headers.set("content-type", "application/json");
  if (init?.cookie) headers.set("cookie", init.cookie);
  return workerFetch(path, {
    ...init,
    headers,
    body: init?.json === undefined ? undefined : JSON.stringify(init.json),
  });
}

function extractGuestCookie(response: Response): string {
  const raw = response.headers.get("set-cookie");
  if (!raw) throw new Error("set-cookie header missing from guest warmup response");
  return raw.split(";")[0];
}

interface WarmupResponse {
  sessionId: string;
}

async function bootGuest(): Promise<{ sessionId: string; cookie: string }> {
  const response = await guestFetch("/api/guest/warmup", { method: "POST" });
  if (response.status !== 200) throw new Error(`warmup failed: ${response.status}`);
  const body = await readJson<WarmupResponse>(response);
  return { sessionId: body.sessionId, cookie: extractGuestCookie(response) };
}

interface DemoSkillsResponse {
  transformers: Array<{
    id: string;
    label: string;
    description: string;
  }>;
}

describe("guest routes", () => {
  describe("POST /api/guest/warmup", () => {
    it("rejects requests without web origin", async () => {
      const response = await workerFetch("/api/guest/warmup", { method: "POST" });
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_origin_forbidden",
      });
    });

    it("warms up a guest session and returns a sessionId", async () => {
      const response = await guestFetch("/api/guest/warmup", { method: "POST" });

      expect(response.status).toBe(200);
      const body = await readJson<WarmupResponse>(response);
      expect(body.sessionId).toBeTruthy();
      expect(typeof body.sessionId).toBe("string");

      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toBeTruthy();
    });

    it("reuses session on subsequent warmup with cookie", async () => {
      const firstResponse = await guestFetch("/api/guest/warmup", { method: "POST" });
      expect(firstResponse.status).toBe(200);
      const firstBody = await readJson<WarmupResponse>(firstResponse);
      const cookie = extractGuestCookie(firstResponse);

      const secondResponse = await guestFetch("/api/guest/warmup", {
        method: "POST",
        cookie,
      });
      expect(secondResponse.status).toBe(200);
      const secondBody = await readJson<WarmupResponse>(secondResponse);

      // The session token is re-signed with a fresh TTL on every warmup, so the
      // raw sessionId can differ across a second boundary; reuse means the same
      // guest identity and no replacement cookie.
      const decodeUid = (sessionId: string) =>
        (
          JSON.parse(atob(sessionId.split(".")[0]!.replace(/-/g, "+").replace(/_/g, "/"))) as {
            uid: string;
          }
        ).uid;
      expect(decodeUid(secondBody.sessionId)).toBe(decodeUid(firstBody.sessionId));
      expect(secondResponse.headers.get("set-cookie")).toBeNull();
    });
  });

  describe("GET /api/guest/skills", () => {
    it("rejects requests without web origin", async () => {
      const response = await workerFetch("/api/guest/skills");
      expect(response.status).toBe(403);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_origin_forbidden",
      });
    });

    it("returns demo skills list", async () => {
      const response = await guestFetch("/api/guest/skills");

      expect(response.status).toBe(200);
      const body = await readJson<DemoSkillsResponse>(response);
      expect(body.transformers).toBeInstanceOf(Array);
      expect(body.transformers.length).toBeGreaterThanOrEqual(1);

      for (const skill of body.transformers) {
        expect(skill).toHaveProperty("id");
        expect(skill).toHaveProperty("label");
        expect(skill).toHaveProperty("description");
        expect(skill.label).toBeTruthy();
      }
    });
  });

  describe("POST /api/guest/sessions/:sessionId/transcribe", () => {
    it("rejects requests without web origin", async () => {
      const response = await workerFetch("/api/guest/sessions/any/transcribe", { method: "POST" });
      expect(response.status).toBe(403);
    });

    it("rejects requests without a prior warmup (no cookie)", async () => {
      const form = new FormData();
      form.append("audio", new Blob(["fake-audio"], { type: "audio/webm" }));
      form.append("locale", "auto");

      const response = await guestFetch("/api/guest/sessions/missing/transcribe", {
        method: "POST",
        body: form,
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_validation",
      });
    });

    // In-process: build the real GuestLive graph but inject test layers for the
    // two AI ports (SpeechToText + SkillExecutor) and run the job-service Effect
    // directly. No HTTP, no module-global override — the only mocked seams are the
    // AI adapters; D1 (demo_transcripts) and the rest of the wiring stay real.
    it("transcribes audio with injected test AI layers (in-process)", async () => {
      const layer = GuestLive(env, {
        speechToTextLayer: TestSpeechToTextLive({ text: "guest transcription test", duration: 4 }),
        skillExecutorLayer: TestSkillExecutorLive({ response: "guest transcription test" }),
      }).pipe(Layer.provide(Layer.mergeAll(NoopObservabilityLive, InlineBackgroundTasksLive)));

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const jobs = yield* GuestJobService;
          return yield* jobs.startTranscribe({
            agentId: "in-process-test-agent",
            audio: new Blob([new Uint8Array(64)], { type: "audio/webm" }),
            locale: "auto",
          });
        }).pipe(Effect.provide(layer))
      );

      expect(result.rawText).toBe("guest transcription test");
      expect(result.cleanText).toBeTruthy();
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe("POST /api/guest/sessions/:sessionId/skills (execute)", () => {
    it("rejects requests without web origin", async () => {
      const response = await workerJson("/api/guest/sessions/any/skills", {
        method: "POST",
        json: { skillId: "cleanup", text: "hello world" },
      });
      expect(response.status).toBe(403);
    });

    it("rejects requests without a prior warmup (no cookie)", async () => {
      const response = await guestJson("/api/guest/sessions/missing/skills", {
        method: "POST",
        json: { skillId: "cleanup", text: "hello world" },
      });

      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_validation",
      });
    });

    it("rejects non-demo skill IDs", async () => {
      const { sessionId, cookie } = await bootGuest();

      const response = await guestJson(`/api/guest/sessions/${sessionId}/skills`, {
        method: "POST",
        json: { skillId: "nonexistent-skill", text: "hello world" },
        cookie,
      });

      expect(response.status).toBe(400);
    });

    // In-process counterpart of the transcribe test: inject only the SkillExecutor
    // AI port and run GuestJobService.startSkill directly. The mocked executor's
    // output flows through runDemoSkill to cleanText; D1 stays real.
    it("executes a demo skill with an injected test SkillExecutor layer (in-process)", async () => {
      const layer = GuestLive(env, {
        skillExecutorLayer: TestSkillExecutorLive({ response: "polished guest text" }),
      }).pipe(Layer.provide(Layer.mergeAll(NoopObservabilityLive, InlineBackgroundTasksLive)));

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const jobs = yield* GuestJobService;
          return yield* jobs.startSkill({
            agentId: "in-process-test-agent",
            skillId: "cleanup",
            locale: "auto",
            inputText: "hello world",
          });
        }).pipe(Effect.provide(layer))
      );

      expect(result.cleanText).toBe("polished guest text");
      expect(result.wordCount).toBeGreaterThan(0);
    });
  });

  describe("POST /api/guest/sessions/:sessionId/skills (validation)", () => {
    it("rejects empty text", async () => {
      const { sessionId, cookie } = await bootGuest();

      const response = await guestJson(`/api/guest/sessions/${sessionId}/skills`, {
        method: "POST",
        json: { skillId: "cleanup", text: "" },
        cookie,
      });

      expect(response.status).toBe(400);
    });

    it("rejects missing skillId", async () => {
      const { sessionId, cookie } = await bootGuest();

      const response = await guestJson(`/api/guest/sessions/${sessionId}/skills`, {
        method: "POST",
        json: { text: "hello world" },
        cookie,
      });

      expect(response.status).toBe(400);
    });

    it("rejects invalid JSON body", async () => {
      const { sessionId, cookie } = await bootGuest();

      const response = await guestFetch(`/api/guest/sessions/${sessionId}/skills`, {
        method: "POST",
        cookie,
        headers: { "content-type": "application/json" },
        body: "not-valid-json{{{",
      });

      expect(response.status).toBe(400);
    });
  });

  describe("OPTIONS /api/guest/warmup (CORS preflight)", () => {
    it("returns 204 with CORS headers for trusted origin", async () => {
      const response = await guestFetch("/api/guest/warmup", { method: "OPTIONS" });

      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-origin")).toBe(TRUSTED_ORIGIN);
      expect(response.headers.get("access-control-allow-credentials")).toBe("true");
      expect(response.headers.get("access-control-allow-methods")).toContain("POST");
    });

    it("does not set CORS headers for untrusted origin", async () => {
      const response = await workerFetch("/api/guest/warmup", {
        method: "OPTIONS",
        headers: { Origin: "https://evil.com" },
      });

      expect(response.headers.get("access-control-allow-origin")).toBeNull();
    });
  });
});
