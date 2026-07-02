import { Effect } from "effect";
import type { Context } from "hono";
import type { ErrorResponse } from "@whisper/api";
import { payloadTooLargeResponse, validationResponse } from "../../lib/http-errors";

type AnyEnv = { Bindings: Env };

export const WhisperSessionHttp = <E extends AnyEnv>(c: Context<E>) => ({
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
  warmup: () =>
    Effect.succeed(
      c.json({ error_code: "er_internal" } satisfies ErrorResponse<"er_internal">, 500)
    ),
  transcriptionFailed: (e: { readonly message: string }) =>
    Effect.succeed(
      c.json(
        {
          error_code: "er_internal",
          details: { message: e.message },
        } satisfies ErrorResponse<"er_internal", { message: string }>,
        502
      )
    ),
  multipartTooLarge: (e: { readonly size: number; readonly max: number }) =>
    Effect.succeed(payloadTooLargeResponse(c, e.size, e.max)),
  multipartParse: (e: { readonly message: string }) =>
    Effect.succeed(validationResponse(c, e.message)),
  multipartValidation: (e: { readonly message: string }) =>
    Effect.succeed(validationResponse(c, e.message)),
});
