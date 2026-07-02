import { env, runInDurableObject } from "cloudflare:test";
import { Effect, Layer } from "effect";
import { afterEach, describe, expect, it } from "vitest";
import { createAuthenticatedUser } from "../setup/auth";
import { insertTestSubscription } from "../setup/db";
import { TestSpeechToTextLive, TestTextGeneratorLive } from "../setup/ai-layers";
import { _testRuntime } from "../../src/modules/whisper-session/runtime";
import {
  SpeechToText,
  type SpeechToTextService,
} from "../../src/modules/transcription/application/ports/speech-to-text";
import type { WhisperAgent } from "../../src/durable-objects/whisper-agent/WhisperAgent";
import { authedFetch, authedJson, readJson } from "../setup/request";

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

const agentFor = (userId: string) => env.WhisperAgent.get(env.WhisperAgent.idFromName(userId));

const audioForm = () => {
  const form = new FormData();
  form.append("audio", new Blob([new Uint8Array(64)], { type: "audio/webm" }));
  form.append("locale", "auto");
  form.append("platform", "desktop");
  return form;
};

async function warmAndTranscribe(cookie: string, sessionId: string) {
  const res = await authedFetch(`/api/sessions/${sessionId}/transcribe`, cookie, {
    method: "POST",
    body: audioForm(),
  });
  expect(res.status).toBe(200);
  return readJson<TranscribeResponse>(res);
}

async function setupProUser(email: string, stripeCustomerId: string) {
  const user = await createAuthenticatedUser({ email, stripeCustomerId });
  await insertTestSubscription({
    referenceId: user.user.id,
    stripeCustomerId,
    status: "active",
    plan: "pro",
  });
  const warmupRes = await authedJson("/api/sessions/warmup", user.cookie, {
    method: "POST",
    json: { appContext: { bundleId: "com.test.editor", host: "example.com" } },
  });
  expect(warmupRes.status).toBe(200);
  const { sessionId } = await readJson<WarmupResponse>(warmupRes);
  return { user, sessionId };
}

describe("WhisperAgent state invariants", () => {
  afterEach(() => {
    _testRuntime.reset();
  });

  it("stores warmup metadata, keeps the completed session for replay, never persists audio", async () => {
    _testRuntime.setOverrides({
      speechToTextLayer: TestSpeechToTextLive({ text: "agent state check", duration: 2 }),
      textGeneratorLayer: TestTextGeneratorLive(),
    });

    const { user, sessionId } = await setupProUser("agent-state@example.com", "cus_agent_state");
    const stub = agentFor(user.user.id);

    // After warmup: the session metadata lives in the agent, keyed by sessionId.
    await runInDurableObject(stub, (instance: WhisperAgent) => {
      expect(instance.state.userId).toBe(user.user.id);
      const entry = instance.state.sessions[sessionId];
      expect(entry).toBeDefined();
      expect(entry?.metadata.bundleId).toBe("com.test.editor");
      expect(entry?.result).toBeUndefined();
    });

    await warmAndTranscribe(user.cookie, sessionId);

    // After transcribe: the session is retained with its result so retries replay
    // it, the transcribed text is persisted, but nothing audio-shaped is stored.
    await runInDurableObject(stub, (instance: WhisperAgent) => {
      const entry = instance.state.sessions[sessionId];
      expect(entry?.result?.rawText).toBe("agent state check");
      const serialized = JSON.stringify(instance.state);
      expect(serialized).not.toContain("audio/webm");
    });
  });

  it("replays the stored result on a repeated transcribe without re-running STT", async () => {
    let sttCalls = 0;
    const countingStt: SpeechToTextService = {
      transcribeAudio: () => {
        sttCalls += 1;
        const text = `transcription number ${sttCalls}`;
        return Effect.succeed({
          engine: "whisper",
          text,
          textLength: text.length,
          wordCount: text.split(/\s+/).length,
          duration: 1,
          durationMs: 1000,
          detectedLanguage: "en",
        });
      },
      transcribeRecording: () =>
        Effect.succeed({
          engine: "whisper",
          text: "unused",
          textLength: 6,
          wordCount: 1,
          duration: 1,
          durationMs: 1000,
          detectedLanguage: "en",
        }),
    };
    _testRuntime.setOverrides({
      speechToTextLayer: Layer.succeed(SpeechToText, countingStt),
      textGeneratorLayer: TestTextGeneratorLive(),
    });

    const { user, sessionId } = await setupProUser("agent-replay@example.com", "cus_agent_replay");

    const first = await warmAndTranscribe(user.cookie, sessionId);
    const second = await warmAndTranscribe(user.cookie, sessionId);

    expect(first.rawText).toBe("transcription number 1");
    // The retry replays the stored result instead of transcribing again, so the
    // text matches the first call and STT ran exactly once (no double-count).
    expect(second.rawText).toBe("transcription number 1");
    expect(second.improvedText).toBe(first.improvedText);
    expect(sttCalls).toBe(1);
  });

  it("runSession fails for a session that was never warmed", async () => {
    const user = await createAuthenticatedUser({
      email: "agent-missing@example.com",
      stripeCustomerId: "cus_agent_missing",
    });
    const stub = agentFor(user.user.id);

    await runInDurableObject(stub, async (instance: WhisperAgent) => {
      await expect(
        instance.runSession({
          userId: user.user.id,
          sessionId: "never-warmed-session",
          audio: new ArrayBuffer(64),
          contentType: "audio/webm",
          locale: "auto",
          skillMarkdown: null,
          timezone: "UTC",
          language: null,
          platform: "desktop",
          os: "unknown",
          surfaceContext: null,
        })
      ).rejects.toThrow(/session_not_found/);
    });
  });
});
