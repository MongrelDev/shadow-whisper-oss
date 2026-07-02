import { Context, Effect } from "effect";
import type { GoogleTokenExchangeError } from "../../errors";

export interface GoogleAuthorizationCode {
  readonly code: string;
  readonly codeVerifier: string;
  readonly redirectUri: string;
}

export interface GoogleTokens {
  readonly idToken: string;
  readonly accessToken: string;
}

export interface GoogleOAuthService {
  readonly exchangeAuthorizationCode: (
    input: GoogleAuthorizationCode
  ) => Effect.Effect<GoogleTokens, GoogleTokenExchangeError>;
}

export class GoogleOAuth extends Context.Service<GoogleOAuth, GoogleOAuthService>()(
  "GoogleOAuth"
) {}
