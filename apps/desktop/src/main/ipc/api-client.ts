import { createApiClient, unwrapApiResponse, type ApiClient } from "@whisper/api/client";
import type { ApiResult } from "@whisper/api";
import { getToken, setToken } from "../lib/token-storage";

let client: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!client) {
    client = createApiClient(__WORKER_URL__, {
      getToken,
      onTokenRefresh: setToken,
    });
  }
  return client;
}

export async function authedFetch(input: URL | string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

type HcResponse = Parameters<typeof unwrapApiResponse>[0];
type JsonOf<R> = R extends { json(): Promise<infer T> } ? T : never;

export async function typedRequest<R extends HcResponse>(
  fn: (client: ApiClient) => Promise<R>
): Promise<ApiResult<JsonOf<R>>> {
  try {
    const res = await fn(getApiClient());
    return unwrapApiResponse(res);
  } catch (error) {
    console.error("[API]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
