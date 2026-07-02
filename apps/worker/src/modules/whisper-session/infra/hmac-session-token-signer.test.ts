import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit } from "effect";
import { makeHmacSessionTokenSigner } from "./hmac-session-token-signer";
import { AUTHENTICATED_WARMUP_PURPOSE } from "../application/ports/session-token-signer";
import { signSessionToken } from "../../../lib/auth-token";

const SECRET = "test-secret-aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const makeEnv = (secret: string) => ({ AUTH_SECRET: secret }) as unknown as Env;

const futurePayload = (userId: string) => ({
  uid: userId,
  purpose: AUTHENTICATED_WARMUP_PURPOSE,
  exp: Math.floor(Date.now() / 1000) + 3600,
});

describe("makeHmacSessionTokenSigner", () => {
  describe("sign + verify round-trip", () => {
    it.effect("returns ok=true with correct user and purpose", () =>
      Effect.gen(function* () {
        const signer = makeHmacSessionTokenSigner(makeEnv(SECRET));
        const payload = futurePayload("user-abc");

        const token = yield* signer.sign(payload);
        const exit = yield* Effect.exit(signer.verify(token, "user-abc"));

        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
          expect(exit.value).toEqual({
            ok: true,
            payload: expect.objectContaining({
              uid: "user-abc",
              purpose: AUTHENTICATED_WARMUP_PURPOSE,
            }),
          });
        }
      })
    );
  });

  describe("wrong_user", () => {
    it.effect("returns ok=false with reason=wrong_user when userId does not match", () =>
      Effect.gen(function* () {
        const signer = makeHmacSessionTokenSigner(makeEnv(SECRET));
        const token = yield* signer.sign(futurePayload("user-abc"));
        const exit = yield* Effect.exit(signer.verify(token, "different-user"));

        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
          expect(exit.value).toEqual({ ok: false, reason: "wrong_user" });
        }
      })
    );
  });

  describe("wrong_purpose", () => {
    it.effect(
      "returns ok=false with reason=wrong_purpose when purpose claim is missing or wrong",
      () =>
        Effect.gen(function* () {
          const signer = makeHmacSessionTokenSigner(makeEnv(SECRET));
          const tokenWithNoPurpose = yield* Effect.promise(() =>
            signSessionToken({ uid: "user-abc", exp: Math.floor(Date.now() / 1000) + 3600 }, SECRET)
          );
          const exit = yield* Effect.exit(signer.verify(tokenWithNoPurpose, "user-abc"));

          expect(Exit.isSuccess(exit)).toBe(true);
          if (Exit.isSuccess(exit)) {
            expect(exit.value).toEqual({ ok: false, reason: "wrong_purpose" });
          }
        })
    );
  });

  describe("tampered signature", () => {
    it.effect("returns ok=false with reason=invalid when token signature is tampered", () =>
      Effect.gen(function* () {
        const signer = makeHmacSessionTokenSigner(makeEnv(SECRET));
        const token = yield* signer.sign(futurePayload("user-abc"));
        const parts = token.split(".");
        const tamperedSig = (parts[1]![0] === "A" ? "B" : "A") + parts[1]!.slice(1);
        const tampered = `${parts[0]}.${tamperedSig}`;

        const exit = yield* Effect.exit(signer.verify(tampered, "user-abc"));

        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
          expect(exit.value.ok).toBe(false);
          if (!exit.value.ok) {
            expect(["invalid", "expired"]).toContain(exit.value.reason);
          }
        }
      })
    );
  });

  describe("expired token", () => {
    it.effect("returns ok=false with reason=expired for past exp", () =>
      Effect.gen(function* () {
        const signer = makeHmacSessionTokenSigner(makeEnv(SECRET));
        const expired = yield* Effect.promise(() =>
          signSessionToken(
            {
              uid: "user-abc",
              purpose: AUTHENTICATED_WARMUP_PURPOSE,
              exp: Math.floor(Date.now() / 1000) - 10,
            },
            SECRET
          )
        );
        const exit = yield* Effect.exit(signer.verify(expired, "user-abc"));

        expect(Exit.isSuccess(exit)).toBe(true);
        if (Exit.isSuccess(exit)) {
          expect(exit.value).toEqual({ ok: false, reason: "expired" });
        }
      })
    );
  });
});
