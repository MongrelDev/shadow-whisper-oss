import { hc } from "hono/client";
import type { ErrorCode } from "./errors";
import type { AppType } from "./routes";
import type { ApiResult } from "./types";

export type ApiClient = ReturnType<typeof createApiClient>;

export interface ApiClientOptions {
  getCookie?: () => string;
  getToken?: () => string | null | Promise<string | null>;
  onTokenRefresh?: (token: string) => void;
}

async function applyAuth(headers: Headers, options: ApiClientOptions): Promise<void> {
  if (options.getToken) {
    const token = await options.getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  } else if (options.getCookie) {
    const cookie = options.getCookie();
    if (cookie) headers.set("cookie", cookie);
  }
}

export function createApiClient(baseUrl: string, options: ApiClientOptions) {
  return hc<AppType>(baseUrl, {
    fetch: async (
      input: Parameters<typeof globalThis.fetch>[0],
      init?: Parameters<typeof globalThis.fetch>[1]
    ) => {
      const headers = new Headers(init?.headers);
      await applyAuth(headers, options);
      const response = await globalThis.fetch(input, { ...init, headers });
      if (options.onTokenRefresh) {
        const newToken = response.headers.get("set-auth-token");
        if (newToken) options.onTokenRefresh(newToken);
      }
      return response;
    },
  });
}

interface HcResponse {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

const hasJsonBody = (response: HcResponse): boolean => {
  if (response.status === 204 || response.status === 205) return false;
  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") return false;
  const contentType = response.headers.get("content-type") ?? "";
  return contentType.includes("application/json");
};

type JsonOf<R> = R extends { json(): Promise<infer T> } ? T : never;

const buildErrorResult = async (
  response: HcResponse
): Promise<{ success: false; error: string; code?: ErrorCode }> => {
  const body = (await response.json().catch(() => ({
    error: `HTTP ${response.status}`,
  }))) as Record<string, unknown>;

  const details = body.details as { message?: unknown } | undefined;
  const detailsMessage = typeof details?.message === "string" ? details.message : undefined;

  return {
    success: false,
    error: (body.error as string | undefined) ?? detailsMessage ?? `HTTP ${response.status}`,
    code: (body.error_code ?? body.code) as ErrorCode | undefined,
  };
};

export async function unwrapApiResponse<R extends HcResponse>(
  response: R
): Promise<ApiResult<JsonOf<R>>> {
  if (!response.ok) return buildErrorResult(response);
  if (!hasJsonBody(response)) return { success: true, data: undefined as JsonOf<R> };
  return { success: true, data: (await response.json()) as JsonOf<R> };
}
