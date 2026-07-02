import { Hono } from "hono";
import { Effect } from "effect";
import { EmailStatusBody, GoogleTokenBody, effectJson } from "@whisper/api";
import type { EmailStatusResponse, GoogleTokenResponse } from "@whisper/api";
import { byIp, rateLimit } from "../../middleware/rate-limit";
import { AccountReader } from "./application/ports/account-reader";
import { GoogleTokenExchangeService } from "./application/google-token-exchange-service";
import { runAuthExtrasHandler } from "./runtime";
import { AuthExtrasHttp } from "./http-errors";

const authExtras = new Hono<{ Bindings: Env }>()
  .post(
    "/email-status",
    rateLimit("RATE_LIMIT_5_PER_MIN", byIp("email-status")),
    effectJson(EmailStatusBody, "Email inválido"),
    (c) => {
      const { email } = c.req.valid("json");
      const http = AuthExtrasHttp(c);

      return runAuthExtrasHandler(
        c,
        Effect.gen(function* () {
          const accounts = yield* AccountReader;
          const verified = yield* accounts.emailVerificationStatus(email);
          return c.json({ verified } satisfies EmailStatusResponse);
        }).pipe(Effect.catchTags({ AuthDatabaseError: http.database })),
        "auth.email-status"
      );
    }
  )
  .post(
    "/extension/google/token",
    rateLimit("RATE_LIMIT_5_PER_MIN", byIp("google-token")),
    effectJson(GoogleTokenBody, "Parâmetros inválidos"),
    (c) => {
      const { code, codeVerifier, redirectUri } = c.req.valid("json");
      const http = AuthExtrasHttp(c);

      return runAuthExtrasHandler(
        c,
        Effect.gen(function* () {
          const exchange = yield* GoogleTokenExchangeService;
          return yield* exchange.exchange({
            code,
            codeVerifier,
            redirectUri,
            extensionId: c.env.EXTENSION_ID,
          });
        }).pipe(
          Effect.map((tokens) =>
            c.json({
              idToken: tokens.idToken,
              accessToken: tokens.accessToken,
            } satisfies GoogleTokenResponse)
          ),
          Effect.catchTags({
            InvalidRedirectUriError: http.invalidRedirect,
            GoogleTokenExchangeError: http.tokenExchange,
          })
        ),
        "auth.google-token"
      );
    }
  );

export default authExtras;
