import { afterEach, describe, expect, it } from "vitest";
import { TestAutoEditValidatorLive } from "../setup/ai-layers";
import { _testRuntime } from "../../src/workflows/teach-analysis-workflow";
import { createAuthenticatedUser } from "../setup/auth";
import { authedJson, readJson, workerJson } from "../setup/request";

interface TeachResponse {
  feedbackId: string;
  instanceId: string | null;
}

describe("teach routes", () => {
  afterEach(() => {
    _testRuntime.reset();
  });

  describe("POST /teach", () => {
    it("rejects anonymous access", async () => {
      const response = await workerJson("/teach", {
        method: "POST",
        json: { selectedText: "hello world", lastTranscriptionText: null },
      });
      expect(response.status).toBe(401);
      await expect(response.json()).resolves.toMatchObject({
        error_code: "er_authentication",
      });
    });

    it("rejects empty body", async () => {
      const user = await createAuthenticatedUser({ email: "teach-empty@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {},
      });
      expect(response.status).toBe(400);
    });

    it("rejects empty selectedText", async () => {
      const user = await createAuthenticatedUser({ email: "teach-empty-text@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: { selectedText: "" },
      });
      expect(response.status).toBe(400);
    });

    it("accepts a manual teach submission and returns feedbackId", async () => {
      const user = await createAuthenticatedUser({ email: "teach-manual@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "corect speling",
          lastTranscriptionText: null,
          source: "manual",
        },
      });

      expect(response.status).toBe(202);
      const body = await readJson<TeachResponse>(response);
      expect(body.feedbackId).toBeTruthy();
      expect(typeof body.feedbackId).toBe("string");
    });

    it("accepts an auto-edit teach with candidates and returns instanceId", async () => {
      _testRuntime.setOverrides({
        autoEditValidatorLayer: TestAutoEditValidatorLive(),
      });

      const user = await createAuthenticatedUser({ email: "teach-auto@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "correct spelling",
          lastTranscriptionText: "corect speling of the word",
          source: "auto-edit",
          candidates: [{ from: "corect", to: "correct" }],
        },
      });

      expect(response.status).toBe(202);
      const body = await readJson<TeachResponse>(response);
      expect(body.feedbackId).toBeTruthy();
      expect(body.instanceId).toBeTruthy();
      expect(typeof body.instanceId).toBe("string");
    });

    it("returns null instanceId when auto-edit candidates are filtered out", async () => {
      _testRuntime.setOverrides({
        autoEditValidatorLayer: TestAutoEditValidatorLive({ accepted: [] }),
      });

      const user = await createAuthenticatedUser({ email: "teach-auto-filtered@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "password123",
          lastTranscriptionText: "password 123",
          source: "auto-edit",
          candidates: [{ from: "password 123", to: "password123" }],
        },
      });

      expect(response.status).toBe(202);
      const body = await readJson<TeachResponse>(response);
      expect(body.feedbackId).toBeTruthy();
    });

    it("rejects auto-edit without lastTranscriptionText", async () => {
      const user = await createAuthenticatedUser({ email: "teach-auto-no-last@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "correct spelling",
          lastTranscriptionText: null,
          source: "auto-edit",
          candidates: [{ from: "corect", to: "correct" }],
        },
      });
      expect(response.status).toBe(400);
    });

    it("rejects auto-edit without candidates", async () => {
      const user = await createAuthenticatedUser({ email: "teach-auto-no-cand@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "correct spelling",
          lastTranscriptionText: "corect speling",
          source: "auto-edit",
          candidates: [],
        },
      });
      expect(response.status).toBe(400);
    });

    it("rejects invalid source value", async () => {
      const user = await createAuthenticatedUser({ email: "teach-bad-source@example.com" });
      const response = await authedJson("/teach", user.cookie, {
        method: "POST",
        json: {
          selectedText: "hello",
          lastTranscriptionText: null,
          source: "invalid-source",
        },
      });
      expect(response.status).toBe(400);
    });
  });
});
