import { describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { makeGrokSttClient } from "./ai-grok-stt";
import { GROK_STT_MODEL } from "./models";

type RunArgs = Parameters<Env["AI"]["run"]>;

const makeEnv = (response: unknown) => {
  const run = vi.fn<(...args: RunArgs) => Promise<unknown>>().mockResolvedValue(response);
  const env = { AI: { run }, AI_GATEWAY_ID: "gw-123" } as unknown as Env;
  return { env, run };
};

const audio = (): ArrayBuffer => {
  const bytes = new TextEncoder().encode("webm-bytes");
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
};

describe("makeGrokSttClient", () => {
  it("sends audio as a data-uri file with no language or format by default", async () => {
    const { env, run } = makeEnv({
      state: "Completed",
      result: { text: "hello", language: "English", duration: 1.2 },
    });
    const client = makeGrokSttClient(env);

    await Effect.runPromise(client.transcribe({ audio: audio(), contentType: "audio/webm" }));

    const [model, input, options] = run.mock.calls[0]!;
    expect(model).toBe(GROK_STT_MODEL);
    const body = input as Record<string, unknown>;
    expect(body.file).toMatch(/^data:audio\/webm;base64,/);
    expect(body).not.toHaveProperty("format");
    expect(body).not.toHaveProperty("language");
    expect(body).not.toHaveProperty("diarize");
    expect(body).not.toHaveProperty("keyterm");
    expect((options as { gateway: { id: string } }).gateway.id).toBe("gw-123");
  });

  it("enables ITN formatting when formattingLanguage normalizes to a supported code", async () => {
    const { env, run } = makeEnv({ state: "Completed", result: { text: "oi" } });
    const client = makeGrokSttClient(env);

    await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/wav", formattingLanguage: "pt-BR" })
    );

    const body = run.mock.calls[0]![1] as Record<string, unknown>;
    expect(body.language).toBe("pt");
    expect(body.format).toBe(true);
  });

  it("ignores the dictation language and an unsupported formattingLanguage", async () => {
    const { env, run } = makeEnv({ state: "Completed", result: { text: "oi" } });
    const client = makeGrokSttClient(env);

    await Effect.runPromise(
      client.transcribe({
        audio: audio(),
        contentType: "audio/wav",
        language: "pt",
        formattingLanguage: "hu",
      })
    );

    const body = run.mock.calls[0]![1] as Record<string, unknown>;
    expect(body).not.toHaveProperty("language");
    expect(body).not.toHaveProperty("format");
  });

  it("merges, trims, dedupes and caps keyterms at 100", async () => {
    const { env, run } = makeEnv({ state: "Completed", result: { text: "x" } });
    const client = makeGrokSttClient(env);

    const dictionaryHints = ["  Brooklyn  ", "Manhattan", "", "x".repeat(60)];
    const keytermsPrompt = [
      "Manhattan",
      "Queens",
      ...Array.from({ length: 150 }, (_, i) => `t${i}`),
    ];

    await Effect.runPromise(
      client.transcribe({
        audio: audio(),
        contentType: "audio/webm",
        dictionaryHints,
        keytermsPrompt,
      })
    );

    const body = run.mock.calls[0]![1] as Record<string, unknown>;
    const keyterm = body.keyterm as string[];
    expect(keyterm.length).toBe(100);
    expect(keyterm).toContain("Brooklyn"); // trimmed
    expect(keyterm.filter((t) => t === "Manhattan")).toHaveLength(1); // deduped
    expect(keyterm).not.toContain(""); // empty dropped
    expect(keyterm.some((t) => t.length > 50)).toBe(false); // over-long dropped
  });

  it("maps the language display name to a 2-letter code", async () => {
    const { env } = makeEnv({
      state: "Completed",
      result: { text: "olá", language: "Portuguese", duration: 2 },
    });
    const client = makeGrokSttClient(env);

    const result = await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/webm" })
    );

    expect(result).toMatchObject({
      engine: GROK_STT_MODEL,
      text: "olá",
      duration: 2,
      detectedLanguage: "pt",
    });
  });

  it("omits detectedLanguage when the language is unknown", async () => {
    const { env } = makeEnv({ state: "Completed", result: { text: "...", language: "Klingon" } });
    const client = makeGrokSttClient(env);

    const result = await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/webm" })
    );

    expect(result).not.toHaveProperty("detectedLanguage");
    expect(result.text).toBe("...");
    expect(result.duration).toBe(0);
  });

  it("fails with a TranscribeError tagged with the model on binding error", async () => {
    const { env } = makeEnv(undefined);
    (env.AI.run as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("boom"));
    const client = makeGrokSttClient(env);

    const exit = await Effect.runPromiseExit(
      client.transcribe({ audio: audio(), contentType: "audio/webm" })
    );

    expect(exit._tag).toBe("Failure");
  });
});
