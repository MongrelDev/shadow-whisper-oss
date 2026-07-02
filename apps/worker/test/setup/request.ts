import { exports } from "cloudflare:workers";

const TEST_ORIGIN = "https://shadowwhisper.test";

function makeUrl(path: string): string {
  return new URL(path, TEST_ORIGIN).toString();
}

export async function workerFetch(path: string, init?: RequestInit): Promise<Response> {
  const request = new Request(makeUrl(path), init);
  return exports.default.fetch(request);
}

export async function workerJson(
  path: string,
  init?: Omit<RequestInit, "body"> & { json?: unknown }
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("content-type", "application/json");

  return workerFetch(path, {
    ...init,
    headers,
    body: init?.json === undefined ? undefined : JSON.stringify(init.json),
  });
}

export async function authedFetch(
  path: string,
  cookie: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);

  return workerFetch(path, {
    ...init,
    headers,
  });
}

export async function authedJson(
  path: string,
  cookie: string,
  init?: Omit<RequestInit, "body"> & { json?: unknown }
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("cookie", cookie);
  headers.set("content-type", "application/json");

  return workerFetch(path, {
    ...init,
    headers,
    body: init?.json === undefined ? undefined : JSON.stringify(init.json),
  });
}

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function extractCookieHeader(response: Response): string | null {
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const setCookies = headers.getSetCookie?.() ?? [];

  if (setCookies.length > 0) {
    return setCookies.map((cookie) => cookie.split(";", 1)[0]).join("; ");
  }

  const single = response.headers.get("set-cookie");
  if (!single) return null;

  return single
    .split(/,(?=[^;,\s]+=)/g)
    .map((cookie) => cookie.split(";", 1)[0].trim())
    .filter(Boolean)
    .join("; ");
}
