import { Context, Effect } from "effect";
import type { BootError } from "../../errors";

export const GUEST_SESSION_PURPOSE = "guest_session_v1" as const;
export type GuestSessionPurpose = typeof GUEST_SESSION_PURPOSE;

export interface GuestSessionTokenPayload {
  readonly sub: string;
  readonly purpose: GuestSessionPurpose;
  readonly exp: number;
}

export type GuestSessionTokenVerifyResult =
  | { readonly ok: true; readonly payload: GuestSessionTokenPayload }
  | {
      readonly ok: false;
      readonly reason: "invalid" | "expired" | "wrong_identity" | "wrong_purpose";
    };

export interface GuestSessionTokenSignerService {
  readonly sign: (cookieValue: string) => Effect.Effect<string, BootError>;
  readonly verify: (
    token: string,
    expectedCookieValue: string
  ) => Effect.Effect<GuestSessionTokenVerifyResult, BootError>;
}

export class GuestSessionTokenSigner extends Context.Service<
  GuestSessionTokenSigner,
  GuestSessionTokenSignerService
>()("GuestSessionTokenSigner") {}
