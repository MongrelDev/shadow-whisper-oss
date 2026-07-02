import { Context, Effect } from "effect";

export interface GuestSessionService {
  readonly readOrMint: (
    cookieHeader: string | null
  ) => Effect.Effect<{ cookieValue: string; isNew: boolean }>;
  readonly serializeCookie: (value: string) => string;
}

export class GuestSession extends Context.Service<GuestSession, GuestSessionService>()(
  "GuestSession"
) {}
