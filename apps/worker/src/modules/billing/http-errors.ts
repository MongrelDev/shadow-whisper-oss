import { Effect } from "effect";
import type { Context } from "hono";
import type { ErrorResponse } from "@whisper/api";
import { httpDatabase } from "../../lib/http-errors";

type AnyEnv = { Bindings: Env };

const invalidCheckoutTokenResponse = <E extends AnyEnv>(c: Context<E>, message: string): Response =>
  c.json(
    {
      error_code: "er_invalid_checkout_token",
      details: { message },
    } satisfies ErrorResponse<"er_invalid_checkout_token", { message: string }>,
    401
  );

export const missingCheckoutTokenResponse = <E extends AnyEnv>(c: Context<E>): Response =>
  c.json(
    {
      error_code: "er_missing_checkout_token",
      details: { message: "Missing checkout token" },
    } satisfies ErrorResponse<"er_missing_checkout_token", { message: string }>,
    400
  );

export const BillingHttp = <E extends AnyEnv>(c: Context<E>) => ({
  invalidCheckoutToken: (e: { readonly message: string }) =>
    Effect.succeed(invalidCheckoutTokenResponse(c, e.message)),
  database: httpDatabase(c),
});
