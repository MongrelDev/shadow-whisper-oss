import { afterEach, describe, expect, it, vi } from "vitest";
import { Effect } from "effect";
import { makeGroqWhisperClient } from "./ai-groq-whisper";

const makeEnv = () =>
  ({
    CF_ACCOUNT_ID: "acct-1",
    AI_GATEWAY_ID: "gw-123",
    GROQ_API_KEY: "groq-key",
    AI_GATEWAY_TOKEN: "gw-token",
  }) as unknown as Env;

const audio = (): ArrayBuffer => {
  const bytes = new TextEncoder().encode("webm-bytes");
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
};

// The SDK issues internal fetches (e.g. `data:` URIs while encoding multipart)
// before the API call, so the gateway request must be located by URL and
// normalized — the SDK may call fetch(url, init) or fetch(Request).
const stubFetch = (status: number, body: unknown) => {
  const realFetch = fetch;
  const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    if (!url.includes("gateway.ai.cloudflare.com")) {
      return realFetch(input as RequestInfo, init);
    }
    return Promise.resolve(
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      })
    );
  });
  vi.stubGlobal("fetch", fetchMock);

  const apiRequest = async (): Promise<Request> => {
    const call = fetchMock.mock.calls.find(([input]) => {
      const url = input instanceof Request ? input.url : String(input);
      return url.includes("gateway.ai.cloudflare.com");
    });
    expect(call).toBeDefined();
    const [input, init] = call!;
    return input instanceof Request ? input : new Request(input as string | URL, init);
  };

  return { fetchMock, apiRequest };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("makeGroqWhisperClient", () => {
  it("uploads the file with an extension matching the content type", async () => {
    const { apiRequest } = stubFetch(200, { text: "hello", language: "english", duration: 1.5 });
    const client = makeGroqWhisperClient(makeEnv());

    await Effect.runPromise(client.transcribe({ audio: audio(), contentType: "audio/webm" }));

    const request = await apiRequest();
    // The SDK appends Groq's full path (openai/v1/...) to the gateway base —
    // the form shown in the AI Gateway provider docs.
    expect(request.url).toContain(
      "gateway.ai.cloudflare.com/v1/acct-1/gw-123/groq/openai/v1/audio/transcriptions"
    );
    const form = await request.formData();
    const file = form.get("file") as File;
    expect(file.name).toBe("audio.webm");
    expect(form.get("model")).toBe("whisper-large-v3-turbo");
    expect(form.get("response_format")).toBe("verbose_json");
    expect(request.headers.get("authorization")).toBe("Bearer groq-key");
    expect(request.headers.get("cf-aig-authorization")).toBe("Bearer gw-token");
  });

  it("normalizes a locale-style language to its ISO-639-1 subtag", async () => {
    const { apiRequest } = stubFetch(200, { text: "oi" });
    const client = makeGroqWhisperClient(makeEnv());

    await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/wav", language: "pt-BR" })
    );

    const form = await (await apiRequest()).formData();
    expect(form.get("language")).toBe("pt");
    expect((form.get("file") as File).name).toBe("audio.wav");
  });

  it("drops a language that does not normalize to a code", async () => {
    const { apiRequest } = stubFetch(200, { text: "oi" });
    const client = makeGroqWhisperClient(makeEnv());

    await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/webm", language: "auto-detect!" })
    );

    const form = await (await apiRequest()).formData();
    expect(form.get("language")).toBeNull();
  });

  it("joins dictionary hints into the biasing prompt", async () => {
    const { apiRequest } = stubFetch(200, { text: "x" });
    const client = makeGroqWhisperClient(makeEnv());

    await Effect.runPromise(
      client.transcribe({
        audio: audio(),
        contentType: "audio/webm",
        dictionaryHints: ["CoderCamp", "TypeScript"],
      })
    );

    const form = await (await apiRequest()).formData();
    expect(form.get("prompt")).toBe("CoderCamp, TypeScript");
  });

  it("maps the detected language display name to a 2-letter code", async () => {
    stubFetch(200, { text: "olá", language: "Portuguese", duration: 2 });
    const client = makeGroqWhisperClient(makeEnv());

    const result = await Effect.runPromise(
      client.transcribe({ audio: audio(), contentType: "audio/webm" })
    );

    expect(result).toMatchObject({
      engine: "whisper-large-v3-turbo",
      text: "olá",
      duration: 2,
      detectedLanguage: "pt",
    });
  });

  it("fails with a retryable error on a 5xx response", async () => {
    stubFetch(503, "upstream unavailable");
    const client = makeGroqWhisperClient(makeEnv());

    const exit = await Effect.runPromiseExit(
      client.transcribe({ audio: audio(), contentType: "audio/webm" })
    );

    expect(exit._tag).toBe("Failure");
  });
});
