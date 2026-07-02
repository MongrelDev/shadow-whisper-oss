import { Context, Data, Effect } from "effect";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();
const AUDIENCE = "billing-checkout";
const ISSUER_SUFFIX = "/billing";

type CheckoutTokenPayload = { userId: string };

export class InvalidCheckoutTokenError extends Data.TaggedError("InvalidCheckoutTokenError")<{
  readonly message: string;
}> {}

export interface CheckoutTokenService {
  readonly create: (payload: CheckoutTokenPayload) => Effect.Effect<string>;
  readonly verify: (
    token: string
  ) => Effect.Effect<CheckoutTokenPayload, InvalidCheckoutTokenError>;
}

export class CheckoutTokenClient extends Context.Service<
  CheckoutTokenClient,
  CheckoutTokenService
>()("CheckoutTokenClient") {}

export const makeCheckoutTokenService = (env: Env): CheckoutTokenService => {
  const secret = encoder.encode(env.AUTH_SECRET);
  const issuer = `${env.APP_URL}${ISSUER_SUFFIX}`;

  return {
    create: (payload) =>
      Effect.tryPromise(() =>
        new SignJWT(payload)
          .setProtectedHeader({ alg: "HS256" })
          .setIssuer(issuer)
          .setAudience(AUDIENCE)
          .setIssuedAt()
          .setExpirationTime("30m")
          .sign(secret)
      ).pipe(Effect.orDie),

    verify: Effect.fnUntraced(function* (token) {
      const { payload } = yield* Effect.tryPromise({
        try: () => jwtVerify(token, secret, { issuer, audience: AUDIENCE }),
        catch: () =>
          new InvalidCheckoutTokenError({ message: "Invalid or expired checkout token" }),
      });

      const userId = typeof payload.userId === "string" ? payload.userId : null;
      if (!userId) {
        return yield* new InvalidCheckoutTokenError({ message: "Missing userId in token" });
      }

      return { userId } satisfies CheckoutTokenPayload;
    }),
  };
};
