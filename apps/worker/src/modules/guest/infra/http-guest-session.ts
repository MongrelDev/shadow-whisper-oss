import { Effect } from "effect";
import { parseCookie, serializeCookie } from "../../../lib/cookie";
import type { GuestSessionService } from "../application/ports/guest-session";

export const GUEST_COOKIE_NAME = "x-shadow-whisper-guest-key";

export const makeHttpGuestSession = (env: Env): GuestSessionService => ({
  readOrMint: (cookieHeader) =>
    Effect.sync(() => {
      const existing = parseCookie(cookieHeader ?? "", GUEST_COOKIE_NAME);
      if (existing) return { cookieValue: existing, isNew: false };
      return { cookieValue: crypto.randomUUID(), isNew: true };
    }),
  serializeCookie: (value) =>
    serializeCookie(GUEST_COOKIE_NAME, value, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: env.GUEST_COOKIE_DOMAIN,
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    }),
});
