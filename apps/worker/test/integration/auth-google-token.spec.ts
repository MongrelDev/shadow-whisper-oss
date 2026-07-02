import { describe, expect, it, vi } from "vitest";
import { readJson, workerJson } from "../setup/request";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const VALID_REDIRECT_URI = "https://abcdefghijklmnopqrstuvwxyzabcdef.chromiumapp.org/";

interface GoogleTokenResponse {
  idToken: string;
  accessToken: string;
}

interface GoogleTokenErrorResponse {
  error: string;
}

function mockGoogleTokenExchange(response: { ok: boolean; body: Record<string, unknown> }) {
  const originalFetch = globalThis.fetch;

  return vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url =
      typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (url === GOOGLE_TOKEN_URL) {
      return Promise.resolve(
        new Response(JSON.stringify(response.body), {
          status: response.ok ? 200 : 400,
          headers: { "content-type": "application/json" },
        })
      );
    }

    return originalFetch(input as RequestInfo | URL, init);
  });
}

describe("POST /auth/extension/google/token", () => {
  it("rejects empty body", async () => {
    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: {},
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error_code: "er_validation",
    });
  });

  it("rejects missing fields", async () => {
    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: { code: "auth-code" },
    });
    expect(response.status).toBe(400);
  });

  it("rejects empty string fields", async () => {
    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: { code: "", codeVerifier: "", redirectUri: "" },
    });
    expect(response.status).toBe(400);
  });

  it("rejects invalid redirect URI (not chromiumapp.org)", async () => {
    mockGoogleTokenExchange({
      ok: true,
      body: { id_token: "id-tok", access_token: "access-tok" },
    });

    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: {
        code: "auth-code",
        codeVerifier: "verifier",
        redirectUri: "https://evil.com/callback",
      },
    });

    expect(response.status).toBe(400);
    await expect(readJson<GoogleTokenErrorResponse>(response)).resolves.toMatchObject({
      error: "invalid_redirect_uri",
    });
  });

  it("returns tokens on successful Google exchange", async () => {
    mockGoogleTokenExchange({
      ok: true,
      body: {
        id_token: "mock-id-token",
        access_token: "mock-access-token",
      },
    });

    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: {
        code: "valid-auth-code",
        codeVerifier: "valid-verifier",
        redirectUri: VALID_REDIRECT_URI,
      },
    });

    expect(response.status).toBe(200);
    const body = await readJson<GoogleTokenResponse>(response);
    expect(body).toMatchObject({
      idToken: "mock-id-token",
      accessToken: "mock-access-token",
    });
  });

  it("returns error when Google rejects the code", async () => {
    mockGoogleTokenExchange({
      ok: false,
      body: {
        error: "invalid_grant",
        error_description: "Code has expired",
      },
    });

    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: {
        code: "expired-code",
        codeVerifier: "valid-verifier",
        redirectUri: VALID_REDIRECT_URI,
      },
    });

    expect(response.status).toBe(400);
    await expect(readJson<GoogleTokenErrorResponse>(response)).resolves.toMatchObject({
      error: "invalid_grant",
    });
  });

  it("returns error when Google response is missing tokens", async () => {
    mockGoogleTokenExchange({
      ok: true,
      body: {},
    });

    const response = await workerJson("/auth/extension/google/token", {
      method: "POST",
      json: {
        code: "valid-code",
        codeVerifier: "valid-verifier",
        redirectUri: VALID_REDIRECT_URI,
      },
    });

    expect(response.status).toBe(400);
    await expect(readJson<GoogleTokenErrorResponse>(response)).resolves.toMatchObject({
      error: "token_exchange_failed",
    });
  });
});
