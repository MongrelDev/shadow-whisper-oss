import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";
import { AuthLive, AuthService } from "../../src/modules/auth/server";
import { BillingAuthIntegrationLive } from "../../src/modules/billing/infra/live";
import { AffiliateRewardsLive } from "../../src/modules/affiliate/infra/live";
import { resetCoreTables } from "./db";
import { TestEmailLive } from "./email";

beforeAll(async () => {
  await Effect.runPromise(
    Effect.gen(function* () {
      const auth = yield* AuthService;
      yield* Effect.promise(() => auth.$context);
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
  );
});

beforeEach(async () => {
  await resetCoreTables();
});

afterEach(() => {
  vi.restoreAllMocks();
});
