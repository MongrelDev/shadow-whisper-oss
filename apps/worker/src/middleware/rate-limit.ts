import { createMiddleware } from "hono/factory";
import { Effect } from "effect";
import type { Context, MiddlewareHandler } from "hono";
import type { ErrorResponse } from "@whisper/api";
import { checkRateLimit, type RateLimitBindingName } from "../lib/rate-limit";
import { emitOneShotWideEvent } from "../observability/emit-one-shot-wide-event";

type KeyFn = (c: Context<{ Bindings: Env }>) => string | null | Promise<string | null>;

function rateLimitedJson(
  label = "rate-limited"
): ErrorResponse<"er_rate_limit", { message: string; rate_limit: string }> {
  return {
    error_code: "er_rate_limit",
    details: {
      message: "Too many requests. Please wait a moment and try again.",
      rate_limit: label,
    },
  } satisfies ErrorResponse<"er_rate_limit", { message: string; rate_limit: string }>;
}

export function rateLimit(
  binding: RateLimitBindingName,
  getKey: KeyFn
): MiddlewareHandler<{ Bindings: Env }> {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const key = await getKey(c);
    if (!key) return next();

    const success = await checkRateLimit(c.env, binding, key);
    if (!success) {
      Effect.runSync(
        emitOneShotWideEvent(
          c.env,
          "rate_limit.exceeded",
          { binding, rateLimitKey: key },
          { responseStatus: 429 }
        )
      );
      return c.json(rateLimitedJson(key), 429);
    }

    return next();
  });
}

function normalizeEmail(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}

async function readEmailFromBody(request: Request): Promise<string | null> {
  const contentType = request.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      const body = (await request.clone().json()) as Record<string, unknown>;
      return normalizeEmail(body.email);
    }

    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const form = await request.clone().formData();
      return normalizeEmail(form.get("email"));
    }
  } catch {
    return null;
  }

  return null;
}

export const byIp =
  (scope: string): KeyFn =>
  (c) => {
    const ip = c.req.header("CF-Connecting-IP");
    return ip ? `${scope}:ip:${ip}` : null;
  };

export const byEmail =
  (scope: string): KeyFn =>
  async (c) => {
    const email = await readEmailFromBody(c.req.raw);
    return email ? `${scope}:email:${email}` : null;
  };

async function shortHash(value: string): Promise<string> {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return [...new Uint8Array(digest)]
    .slice(0, 16)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const checkoutVerifyRateLimit = rateLimit("RATE_LIMIT_10_PER_MIN", async (c) => {
  const token = c.req.query("token");
  if (token) return `billing.checkout.verify:token:${await shortHash(token)}`;
  const ip = c.req.header("CF-Connecting-IP");
  return ip ? `billing.checkout.verify:ip:${ip}` : null;
});
