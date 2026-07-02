import { Effect } from "effect";
import { signSessionToken, verifySessionToken } from "../../../lib/auth-token";
import { WarmupError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";
import type {
  SessionTokenPayload,
  SessionTokenSignerService,
  SessionTokenVerifyResult,
} from "../application/ports/session-token-signer";
import { AUTHENTICATED_WARMUP_PURPOSE } from "../application/ports/session-token-signer";

export const makeHmacSessionTokenSigner = (env: Env): SessionTokenSignerService => ({
  sign: (payload: SessionTokenPayload) =>
    Effect.tryPromise({
      try: () =>
        signSessionToken(
          { uid: payload.uid, purpose: payload.purpose, exp: payload.exp },
          env.AUTH_SECRET
        ),
      catch: (e) => new WarmupError({ message: unknownMessage(e) }),
    }),

  verify: (token: string, expectedUserId: string) =>
    Effect.tryPromise({
      try: async (): Promise<SessionTokenVerifyResult> => {
        const result = await verifySessionToken(token, env.AUTH_SECRET);
        if (!result.ok) {
          return { ok: false, reason: result.reason === "expired" ? "expired" : "invalid" };
        }
        if (result.payload.uid !== expectedUserId) {
          return { ok: false, reason: "wrong_user" };
        }
        if (result.payload.purpose !== AUTHENTICATED_WARMUP_PURPOSE) {
          return { ok: false, reason: "wrong_purpose" };
        }
        return {
          ok: true,
          payload: {
            uid: expectedUserId,
            purpose: AUTHENTICATED_WARMUP_PURPOSE,
            exp: result.payload.exp,
          },
        };
      },
      catch: (e) => new WarmupError({ message: unknownMessage(e) }),
    }),
});
