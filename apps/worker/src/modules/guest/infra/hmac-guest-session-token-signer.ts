import { Effect } from "effect";
import { signSessionToken, verifySessionToken } from "../../../lib/auth-token";
import { BootError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";
import { hmacAgentId } from "../../../lib/cookie";
import type {
  GuestSessionTokenSignerService,
  GuestSessionTokenVerifyResult,
} from "../application/ports/guest-session-token-signer";
import { GUEST_SESSION_PURPOSE } from "../application/ports/guest-session-token-signer";

const SESSION_TTL_SECONDS = 60 * 60 * 4;

export const makeHmacGuestSessionTokenSigner = (env: Env): GuestSessionTokenSignerService => ({
  sign: (cookieValue) =>
    Effect.tryPromise({
      try: async () => {
        const sub = await hmacAgentId(env.GUEST_SECRET, cookieValue);
        const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
        return signSessionToken({ uid: sub, purpose: GUEST_SESSION_PURPOSE, exp }, env.AUTH_SECRET);
      },
      catch: (e) => new BootError({ message: `guest token sign failed: ${unknownMessage(e)}` }),
    }),

  verify: (token, expectedCookieValue) =>
    Effect.tryPromise({
      try: async (): Promise<GuestSessionTokenVerifyResult> => {
        const result = await verifySessionToken(token, env.AUTH_SECRET);
        if (!result.ok) {
          return {
            ok: false,
            reason: result.reason === "expired" ? "expired" : "invalid",
          };
        }
        if (result.payload.purpose !== GUEST_SESSION_PURPOSE) {
          return { ok: false, reason: "wrong_purpose" };
        }
        const expectedSub = await hmacAgentId(env.GUEST_SECRET, expectedCookieValue);
        if (result.payload.uid !== expectedSub) {
          return { ok: false, reason: "wrong_identity" };
        }
        return {
          ok: true,
          payload: {
            sub: result.payload.uid!,
            purpose: GUEST_SESSION_PURPOSE,
            exp: result.payload.exp,
          },
        };
      },
      catch: (e) => new BootError({ message: `guest token verify failed: ${unknownMessage(e)}` }),
    }),
});
