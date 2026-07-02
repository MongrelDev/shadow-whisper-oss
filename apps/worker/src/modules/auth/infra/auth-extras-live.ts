import { Layer } from "effect";
import { AccountReader } from "../application/ports/account-reader";
import { GoogleOAuth } from "../application/ports/google-oauth";
import { GoogleTokenExchangeServiceLive } from "../application/google-token-exchange-service";
import { makeD1AccountReader } from "./d1-account-reader";
import { makeGoogleOAuthClient } from "./google-oauth-client";

export const AuthExtrasLive = (env: Env) => {
  const infra = Layer.mergeAll(
    Layer.succeed(AccountReader, makeD1AccountReader(env)),
    Layer.succeed(GoogleOAuth, makeGoogleOAuthClient(env))
  );

  return Layer.mergeAll(infra, GoogleTokenExchangeServiceLive.pipe(Layer.provide(infra)));
};
