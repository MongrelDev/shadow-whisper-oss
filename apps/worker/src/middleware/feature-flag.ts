import { createMiddleware } from "hono/factory";
import type { MiddlewareHandler } from "hono";
import type { ErrorResponse } from "@whisper/api";

export function isFeatureEnabled(env: Env, flagKey: string): Promise<boolean> {
  return env.FLAGS.getBooleanValue(flagKey, false).catch(() => false);
}

export function requireFeatureFlag(flagKey: string): MiddlewareHandler<{ Bindings: Env }> {
  return createMiddleware<{ Bindings: Env }>(async (c, next) => {
    const enabled = await c.env.FLAGS.getBooleanValue(flagKey, false);
    if (!enabled) {
      return c.json(
        {
          error_code: "er_feature_disabled",
          details: { message: "This feature is currently unavailable." },
        } satisfies ErrorResponse<"er_feature_disabled", { message: string }>,
        403
      );
    }

    return next();
  });
}
