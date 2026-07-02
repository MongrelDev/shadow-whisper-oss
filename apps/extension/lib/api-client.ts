import { hc } from "hono/client";
import type { AppType } from "@whisper/api";
import { getToken, setToken } from "./token-storage";

const customFetch = async (
  input: Parameters<typeof globalThis.fetch>[0],
  init?: Parameters<typeof globalThis.fetch>[1]
): Promise<Response> => {
  const token = await getToken();
  const headers = new Headers(init?.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const response = await globalThis.fetch(input, { ...init, headers });
  const refreshedToken = response.headers.get("set-auth-token");
  if (refreshedToken) {
    await setToken(refreshedToken);
  }
  return response;
};

export const apiClient = hc<AppType>(import.meta.env.VITE_API_URL, {
  fetch: customFetch,
});
