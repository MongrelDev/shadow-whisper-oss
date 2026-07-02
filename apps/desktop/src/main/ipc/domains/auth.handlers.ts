import { BrowserWindow, ipcMain } from "electron";
import { authClient } from "../../lib/auth-client";
import { getToken, removeToken } from "../../lib/token-storage";
import type { AuthActionResult, AuthActionError, AuthSessionUser } from "../../../shared/ipc-types";
import { m } from "../../../renderer/paraglide/messages";

const WORKER_URL = __WORKER_URL__;

let inFlightSession: Promise<AuthSessionUser | null> | null = null;

function asErrorObject(
  err: unknown
): { message?: unknown; code?: unknown; status?: unknown } | null {
  return err && typeof err === "object"
    ? (err as { message?: unknown; code?: unknown; status?: unknown })
    : null;
}

function resolveAuthErrorMessage(error: { message?: unknown } | null, fallback: unknown): string {
  if (typeof error?.message === "string") {
    return error.message;
  }
  return fallback instanceof Error ? fallback.message : m.er_internal();
}

async function fetchSessionFromClient(): Promise<AuthSessionUser | null> {
  const { data, error } = await authClient.getSession();
  if (error || !data?.user) return null;
  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.name,
    emailVerified: data.user.emailVerified ?? false,
    image: typeof data.user.image === "string" ? data.user.image : null,
  };
}

function toError(err: unknown): AuthActionError {
  const anyErr = asErrorObject(err);
  return {
    message: resolveAuthErrorMessage(anyErr, err),
    code: typeof anyErr?.code === "string" ? anyErr.code : undefined,
    status: typeof anyErr?.status === "number" ? anyErr.status : undefined,
  };
}

function buildRateLimitedAuthResult(message: string): AuthActionResult {
  return {
    ok: false,
    error: {
      message,
      code: "RATE_LIMITED",
      status: 429,
    },
  };
}

async function readAuthErrorPayload(response: Response): Promise<{
  message?: string;
  code?: string;
  error?: string;
} | null> {
  return response.json().catch(() => null) as Promise<{
    message?: string;
    code?: string;
    error?: string;
  } | null>;
}

function getVerificationEmailErrorMessage(
  payload: {
    message?: string;
    error?: string;
  } | null
): string {
  if (payload?.message) return payload.message;
  if (payload?.error) return payload.error;
  return m.er_internal();
}

async function sendVerificationEmail(input: {
  email: string;
  callbackURL: string;
}): Promise<AuthActionResult> {
  const response = await authedFetch("/api/auth/send-verification-email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (response.ok) return { ok: true };
  if (response.status === 429) {
    return buildRateLimitedAuthResult(m.er_rate_limit());
  }
  const payload = await readAuthErrorPayload(response);
  return {
    ok: false,
    error: {
      message: getVerificationEmailErrorMessage(payload),
      code: payload?.code,
      status: response.status,
    },
  };
}

async function authedFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${WORKER_URL}${path}`, { ...init, headers });
}

function broadcastSessionChanged(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send("auth:session-changed");
  }
}

export function setupAuthHandlers(): void {
  ipcMain.on("auth:relay-to-pill", () => broadcastSessionChanged());

  ipcMain.handle("auth:signOut", async (): Promise<AuthActionResult> => {
    try {
      await authClient.signOut();
      removeToken();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: toError(err) };
    }
  });

  ipcMain.handle("auth:getSession", async (): Promise<AuthSessionUser | null> => {
    if (!inFlightSession) {
      inFlightSession = fetchSessionFromClient().finally(() => {
        inFlightSession = null;
      });
    }
    return inFlightSession;
  });

  ipcMain.handle(
    "auth:subscription-upgrade",
    async (
      _event,
      input: { plan: string; annual: boolean; successUrl: string; cancelUrl: string }
    ): Promise<{ url: string | null; error?: AuthActionError }> => {
      const { data, error } = await authClient.subscription.upgrade({
        plan: input.plan,
        annual: input.annual,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
        disableRedirect: true,
      });
      if (error) return { url: null, error: toError(error) };
      return { url: data?.url ?? null };
    }
  );

  ipcMain.handle(
    "auth:subscription-portal",
    async (): Promise<{ url: string | null; error?: AuthActionError }> => {
      const { data, error } = await authClient.subscription.billingPortal({
        disableRedirect: true,
      });
      if (error) return { url: null, error: toError(error) };
      return { url: data?.url ?? null };
    }
  );

  ipcMain.handle(
    "auth:send-verification-email",
    async (_event, input: { email: string; callbackURL: string }): Promise<AuthActionResult> =>
      sendVerificationEmail(input)
  );

  ipcMain.handle(
    "auth:check-email-status",
    async (_event, email: string): Promise<{ verified: boolean; error?: AuthActionError }> => {
      const response = await authedFetch("/auth/email-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.status === 429) {
        return {
          verified: false,
          error: {
            message: m.er_rate_limit(),
            code: "RATE_LIMITED",
            status: 429,
          },
        };
      }
      if (!response.ok) {
        return {
          verified: false,
          error: {
            message: m.er_internal(),
            status: response.status,
          },
        };
      }
      const data = (await response.json()) as { verified?: boolean };
      return { verified: Boolean(data.verified) };
    }
  );

  ipcMain.handle(
    "auth:checkout-status-token",
    async (): Promise<{ token: string | null; error?: AuthActionError }> => {
      const response = await authedFetch("/billing/checkout-token", { method: "POST" });
      if (!response.ok) {
        return {
          token: null,
          error: { message: m.er_internal(), status: response.status },
        };
      }
      const data = (await response.json()) as { token?: string };
      return { token: data.token ?? null };
    }
  );
}
