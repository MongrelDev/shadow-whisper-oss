import { Effect } from "effect";
import type { Context } from "hono";
import { internalResponse } from "../../lib/http-errors";

type AnyEnv = { Bindings: Env };

export const AuthExtrasHttp = <E extends AnyEnv>(c: Context<E>) => ({
  database: (e: { readonly message: string }) => Effect.succeed(internalResponse(c, e.message)),
  invalidRedirect: () => Effect.succeed(c.json({ error: "invalid_redirect_uri" }, 400)),
  tokenExchange: (e: { readonly reason: string }) =>
    Effect.succeed(c.json({ error: e.reason }, 400)),
});
