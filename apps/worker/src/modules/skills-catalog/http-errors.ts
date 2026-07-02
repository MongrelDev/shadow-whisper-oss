import { Effect } from "effect";
import type { Context } from "hono";
import type { ErrorResponse } from "@whisper/api";
import { httpDatabase, httpInternal, validationResponse } from "../../lib/http-errors";

type AnyEnv = { Bindings: Env };

const notFoundResponse = <E extends AnyEnv>(c: Context<E>, message: string): Response =>
  c.json(
    {
      error_code: "er_skill_not_found",
      details: { message },
    } satisfies ErrorResponse<"er_skill_not_found", { message: string }>,
    404
  );

export const SkillHttp = <E extends AnyEnv>(c: Context<E>) => ({
  notFound: () => Effect.succeed(notFoundResponse(c, "Skill not found")),
  validationField: (e: { readonly field: string; readonly message: string }) =>
    Effect.succeed(validationResponse(c, `${e.field}: ${e.message}`)),
  limitExceeded: (e: { readonly usage: unknown }) =>
    Effect.succeed(
      c.json(
        {
          error_code: "er_limit_exceeded",
          details: { usage: e.usage },
        } satisfies ErrorResponse<"er_limit_exceeded", { usage: unknown }>,
        402
      )
    ),
  internal: httpInternal(c),
  database: httpDatabase(c),
  executionFailed: (e: { readonly message: string }) =>
    Effect.succeed(
      c.json(
        {
          error_code: "er_internal",
          details: { message: e.message },
        } satisfies ErrorResponse<"er_internal", { message: string }>,
        502
      )
    ),
});
