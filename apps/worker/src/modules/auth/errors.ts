import { Data } from "effect";

export class AuthDatabaseError extends Data.TaggedError("AuthDatabaseError")<{
  readonly message: string;
}> {}

export class InvalidRedirectUriError extends Data.TaggedError("InvalidRedirectUriError")<{
  readonly redirectUri: string;
}> {}

export class GoogleTokenExchangeError extends Data.TaggedError("GoogleTokenExchangeError")<{
  readonly reason: string;
}> {}
