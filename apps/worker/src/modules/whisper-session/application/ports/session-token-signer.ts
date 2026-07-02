import { Context, Effect } from "effect";
import type { WarmupError } from "../../errors";

export const AUTHENTICATED_WARMUP_PURPOSE = "authenticated_warmup_v1" as const;
export type AuthenticatedWarmupPurpose = typeof AUTHENTICATED_WARMUP_PURPOSE;

export interface SessionTokenPayload {
  readonly uid: string;
  readonly purpose: AuthenticatedWarmupPurpose;
  readonly exp: number;
}

export type SessionTokenVerifyResult =
  | { readonly ok: true; readonly payload: SessionTokenPayload }
  | { readonly ok: false; readonly reason: "invalid" | "expired" | "wrong_user" | "wrong_purpose" };

export interface SessionTokenSignerService {
  readonly sign: (payload: SessionTokenPayload) => Effect.Effect<string, WarmupError>;
  readonly verify: (
    token: string,
    expectedUserId: string
  ) => Effect.Effect<SessionTokenVerifyResult, WarmupError>;
}

export class SessionTokenSigner extends Context.Service<
  SessionTokenSigner,
  SessionTokenSignerService
>()("SessionTokenSigner") {}
