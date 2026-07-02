import { Effect } from "effect";
import type { Context } from "hono";
import type { ErrorResponse } from "@whisper/api";

type AnyEnv = { Bindings: Env };

export const internalResponse = <E extends AnyEnv>(c: Context<E>, message: string): Response =>
  c.json(
    {
      error_code: "er_internal",
      details: { message },
    } satisfies ErrorResponse<"er_internal", { message: string }>,
    500
  );

export const databaseResponse = <E extends AnyEnv>(c: Context<E>, message: string): Response =>
  c.json(
    {
      error_code: "er_database",
      details: { message },
    } satisfies ErrorResponse<"er_database", { message: string }>,
    500
  );

export const validationResponse = <E extends AnyEnv>(c: Context<E>, message: string): Response =>
  c.json(
    {
      error_code: "er_validation",
      details: { message },
    } satisfies ErrorResponse<"er_validation", { message: string }>,
    400
  );

export const unauthorizedResponse = <E extends AnyEnv>(c: Context<E>): Response =>
  c.json({ error_code: "er_authentication" } satisfies ErrorResponse<"er_authentication">, 401);

export const httpUnauthorized =
  <E extends AnyEnv>(c: Context<E>) =>
  () =>
    Effect.succeed(unauthorizedResponse(c));

export const rateLimitedResponse = <E extends AnyEnv>(c: Context<E>, label: string): Response =>
  c.json(
    {
      error_code: "er_rate_limit",
      details: {
        message: "Too many requests. Please wait a moment and try again.",
        rate_limit: label,
      },
    } satisfies ErrorResponse<"er_rate_limit", { message: string; rate_limit: string }>,
    429
  );

export const httpRateLimited =
  <E extends AnyEnv>(c: Context<E>) =>
  (e: { readonly label: string }) =>
    Effect.succeed(rateLimitedResponse(c, e.label));

export const httpInternal =
  <E extends AnyEnv>(c: Context<E>) =>
  (e: { readonly message: string }) =>
    Effect.succeed(internalResponse(c, e.message));

export const httpDatabase =
  <E extends AnyEnv>(c: Context<E>) =>
  (e: { readonly message: string }) =>
    Effect.succeed(databaseResponse(c, e.message));

export const payloadTooLargeResponse = <E extends AnyEnv>(
  c: Context<E>,
  size: number,
  max: number
): Response =>
  c.json(
    {
      error_code: "er_payload_too_large",
      details: { size, max },
    } satisfies ErrorResponse<"er_payload_too_large", { size: number; max: number }>,
    413
  );

export const httpPayloadTooLarge =
  <E extends AnyEnv>(c: Context<E>) =>
  (e: { readonly size: number; readonly max: number }) =>
    Effect.succeed(payloadTooLargeResponse(c, e.size, e.max));
