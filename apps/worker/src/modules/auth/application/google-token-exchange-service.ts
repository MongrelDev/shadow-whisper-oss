import { Context, Effect, Layer } from "effect";
import { isValidExtensionRedirectUri } from "../domain/extension-redirect";
import { GoogleOAuth, type GoogleTokens } from "./ports/google-oauth";
import { InvalidRedirectUriError, type GoogleTokenExchangeError } from "../errors";

export interface ExchangeGoogleTokenInput {
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
  readonly extensionId: string;
}

export interface GoogleTokenExchangeServiceShape {
  readonly exchange: (
    input: ExchangeGoogleTokenInput
  ) => Effect.Effect<GoogleTokens, InvalidRedirectUriError | GoogleTokenExchangeError>;
}

export class GoogleTokenExchangeService extends Context.Service<
  GoogleTokenExchangeService,
  GoogleTokenExchangeServiceShape
>()("GoogleTokenExchangeService") {}

export const GoogleTokenExchangeServiceLive = Layer.effect(
  GoogleTokenExchangeService,
  Effect.map(GoogleOAuth, (google) =>
    GoogleTokenExchangeService.of({
      /**
       * Enforces the validate-then-exchange ordering: a redirect that does not belong
       * to the extension never reaches Google's token endpoint.
       */
      exchange: Effect.fnUntraced(function* (input: ExchangeGoogleTokenInput) {
        if (!isValidExtensionRedirectUri(input.redirectUri, input.extensionId)) {
          return yield* new InvalidRedirectUriError({ redirectUri: input.redirectUri });
        }

        return yield* google.exchangeAuthorizationCode({
          code: input.code,
          codeVerifier: input.codeVerifier,
          redirectUri: input.redirectUri,
        });
      }),
    })
  )
);
