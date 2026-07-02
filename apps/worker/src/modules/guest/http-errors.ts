import { Effect } from "effect";
import type { Context } from "hono";
import type { ErrorResponse } from "@whisper/api";
import {
  internalResponse,
  payloadTooLargeResponse,
  validationResponse,
} from "../../lib/http-errors";

type AnyEnv = { Bindings: Env };

const sessionAuthResponse = <E extends AnyEnv>(c: Context<E>): Response =>
  c.json(
    {
      error_code: "er_validation",
      details: { message: "Guest session required" },
    } satisfies ErrorResponse<"er_validation", { message: string }>,
    401
  );

export const GuestHttp = <E extends AnyEnv>(c: Context<E>) => {
  const startFail = () => Effect.succeed(internalResponse(c, "Failed to start workflow"));
  return {
    sessionAuthFailed: () => Effect.succeed(sessionAuthResponse(c)),
    workflowStartFailed: startFail,
    bootFailed: startFail,
    jobRepoFailed: startFail,
    multipartTooLarge: (e: { readonly size: number; readonly max: number }) =>
      Effect.succeed(payloadTooLargeResponse(c, e.size, e.max)),
    multipartParse: (e: { readonly message: string }) =>
      Effect.succeed(validationResponse(c, e.message)),
    multipartValidation: (e: { readonly message: string }) =>
      Effect.succeed(validationResponse(c, e.message)),
    jsonParse: (e: { readonly message: string }) =>
      Effect.succeed(validationResponse(c, e.message)),
    jsonValidation: (e: { readonly message: string }) =>
      Effect.succeed(validationResponse(c, e.message)),
  };
};
