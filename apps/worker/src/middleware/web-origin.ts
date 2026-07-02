import { createMiddleware } from "hono/factory";
import type { MiddlewareHandler } from "hono";
import type { ErrorResponse } from "@whisper/api";

export function requireWebOrigin(): MiddlewareHandler<{ Bindings: Env }> {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const origin = c.req.header("Origin") ?? c.req.header("Referer") ?? "";
    const trusted = [c.env.APP_URL, ...(c.env.TRUSTED_ORIGINS?.split(",").filter(Boolean) ?? [])];
    const ok = trusted.some((t) => origin === t || origin.startsWith(`${t}/`));
    if (!ok) {
      return c.json(
        { error_code: "er_origin_forbidden" } satisfies ErrorResponse<"er_origin_forbidden">,
        403
      );
    }
    return next();
  });
}

export function corsForCredentials(): MiddlewareHandler<{ Bindings: Env }> {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const origin = c.req.header("Origin") ?? "";
    const trusted = [c.env.APP_URL, ...(c.env.TRUSTED_ORIGINS?.split(",").filter(Boolean) ?? [])];
    const isTrusted = trusted.some((t) => origin === t || origin.startsWith(`${t}/`));

    if (isTrusted) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Access-Control-Allow-Credentials", "true");
      c.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type");
      c.header("Vary", "Origin");
    }

    if (c.req.method === "OPTIONS") {
      return c.body(null, 204);
    }

    return next();
  });
}
