import { describe, expect, it } from "@effect/vitest";
import { Cause, Effect, Exit, Layer, Result } from "effect";
import {
  GoogleTokenExchangeService,
  GoogleTokenExchangeServiceLive,
} from "./google-token-exchange-service";
import { GoogleOAuth, type GoogleOAuthService } from "./ports/google-oauth";
import { GoogleTokenExchangeError } from "../errors";
import { isValidExtensionRedirectUri } from "../domain/extension-redirect";

const EXTENSION_ID = "a".repeat(32);
const VALID_REDIRECT = `https://${EXTENSION_ID}.chromiumapp.org/`;

const makeGoogle = (overrides: Partial<GoogleOAuthService> = {}): GoogleOAuthService => ({
  exchangeAuthorizationCode: () => Effect.succeed({ idToken: "id-token", accessToken: "access" }),
  ...overrides,
});

const run = (
  google: GoogleOAuthService,
  extensionId = EXTENSION_ID,
  redirectUri = VALID_REDIRECT
) =>
  Effect.gen(function* () {
    const service = yield* GoogleTokenExchangeService;
    return yield* service.exchange({
      code: "auth-code",
      codeVerifier: "verifier",
      redirectUri,
      extensionId,
    });
  }).pipe(
    Effect.provide(
      GoogleTokenExchangeServiceLive.pipe(Layer.provide(Layer.succeed(GoogleOAuth, google)))
    ),
    Effect.exit
  );

describe("isValidExtensionRedirectUri", () => {
  it("accepts the extension's own chromiumapp callback", () => {
    expect(isValidExtensionRedirectUri(VALID_REDIRECT, EXTENSION_ID)).toBe(true);
  });

  it("rejects a callback belonging to a different extension", () => {
    const other = `https://${"b".repeat(32)}.chromiumapp.org/`;
    expect(isValidExtensionRedirectUri(other, EXTENSION_ID)).toBe(false);
  });

  it("rejects non-chromiumapp redirect targets", () => {
    expect(isValidExtensionRedirectUri("https://evil.example.com/", EXTENSION_ID)).toBe(false);
  });
});

describe("GoogleTokenExchangeService", () => {
  it.effect("never reaches the token endpoint when the redirect is invalid", () =>
    Effect.gen(function* () {
      let called = false;
      const exit = yield* run(
        makeGoogle({
          exchangeAuthorizationCode: () => {
            called = true;
            return Effect.succeed({ idToken: "x", accessToken: "y" });
          },
        }),
        EXTENSION_ID,
        "https://evil.example.com/"
      );

      expect(called).toBe(false);
      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = Cause.findError(exit.cause);
        expect(Result.isSuccess(error) && error.success._tag).toBe("InvalidRedirectUriError");
      }
    })
  );

  it.effect("delegates to the OAuth port and returns its tokens for a valid redirect", () =>
    Effect.gen(function* () {
      const exit = yield* run(makeGoogle());
      expect(exit).toStrictEqual(Exit.succeed({ idToken: "id-token", accessToken: "access" }));
    })
  );

  it.effect("propagates a token exchange failure as GoogleTokenExchangeError", () =>
    Effect.gen(function* () {
      const exit = yield* run(
        makeGoogle({
          exchangeAuthorizationCode: () =>
            Effect.fail(new GoogleTokenExchangeError({ reason: "invalid_grant" })),
        })
      );

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = Cause.findError(exit.cause);
        expect(Result.isSuccess(error) && error.success._tag).toBe("GoogleTokenExchangeError");
      }
    })
  );
});
