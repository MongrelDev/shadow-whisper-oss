import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { AuthLive, AuthService } from "../../src/modules/auth/server";
import { BillingAuthIntegrationLive } from "../../src/modules/billing/infra/live";
import { AffiliateRewardsLive } from "../../src/modules/affiliate/infra/live";
import { insertTestUser, type TestUserInput } from "./db";
import { TestEmailLive } from "./email";

interface BetterAuthTestLoginResult {
  headers: Headers;
  session: unknown;
}

interface BetterAuthTestContext {
  test: {
    login(input: { userId: string }): Promise<BetterAuthTestLoginResult>;
  };
}

export async function createAuthenticatedUser(input: TestUserInput = {}) {
  const user = await insertTestUser(input);
  const auth = (await Effect.runPromise(
    Effect.gen(function* () {
      return yield* AuthService;
    }).pipe(
      Effect.provide(
        AuthLive(env, {
          enableTestUtils: true,
        }).pipe(
          Layer.provide(
            Layer.mergeAll(
              TestEmailLive,
              BillingAuthIntegrationLive(env).pipe(Layer.provide(AffiliateRewardsLive(env)))
            )
          )
        )
      )
    )
  )) as {
    $context: Promise<BetterAuthTestContext>;
  };
  const login = await auth.$context.then((ctx) => ctx.test.login({ userId: user.id }));
  const cookie = login.headers.get("cookie");

  if (!cookie) {
    throw new Error("Better Auth test login did not return a cookie header");
  }

  return { user, session: login.session, cookie };
}
