import { Effect } from "effect";
import type { GoogleOAuthService } from "../application/ports/google-oauth";
import { GoogleTokenExchangeError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

interface GoogleTokenResponseBody {
  id_token?: string;
  access_token?: string;
  error?: string;
  error_description?: string;
}

export const makeGoogleOAuthClient = (env: Env): GoogleOAuthService => ({
  exchangeAuthorizationCode: Effect.fnUntraced(function* (input) {
    const data = yield* Effect.tryPromise({
      try: async () => {
        const res = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code: input.code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: input.redirectUri,
            grant_type: "authorization_code",
            code_verifier: input.codeVerifier,
          }),
        });
        return {
          ok: res.ok,
          body: (await res.json()) as GoogleTokenResponseBody,
        };
      },
      catch: (e) => new GoogleTokenExchangeError({ reason: unknownMessage(e) }),
    });

    if (!data.ok || !data.body.id_token || !data.body.access_token) {
      return yield* new GoogleTokenExchangeError({
        reason: data.body.error ?? "token_exchange_failed",
      });
    }

    return { idToken: data.body.id_token, accessToken: data.body.access_token };
  }),
});
