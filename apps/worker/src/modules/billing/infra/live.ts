import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql/SqlClient";
import { createDb } from "@whisper/db";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { AffiliateRewardService } from "../../affiliate/application/affiliate-reward-service";
import { BillingAuthIntegration } from "../application/ports/billing-auth-integration";
import { SubscriptionServiceLive } from "../application/subscription-service";
import { BillingQueriesLive } from "../application/billing-queries";
import { SubscriptionRepository } from "../application/ports/subscription-repository";
import { UsageReader } from "../application/ports/usage-reader";
import { CheckoutTokenClient, makeCheckoutTokenService } from "../checkout-token";
import { makeBillingAuthIntegration } from "./billing-auth-integration";
import { makeDrizzleSubscriptionRepository } from "./subscription-repository";
import { makeD1UsageReader } from "./d1-usage-reader";

const BillingInfrastructureLive = (env: Env) => {
  const db = createDb(env.DB);
  const usageReaderLayer = Layer.effect(
    UsageReader,
    Effect.gen(function* () {
      const sql = yield* SqlClient;
      return makeD1UsageReader(sql);
    })
  ).pipe(Layer.provide(D1SqlLive(env)));

  return Layer.mergeAll(
    usageReaderLayer,
    Layer.succeed(SubscriptionRepository, makeDrizzleSubscriptionRepository(db))
  );
};

export const BillingLive = (env: Env) => {
  const infra = BillingInfrastructureLive(env);
  const subscriptionLayer = SubscriptionServiceLive.pipe(Layer.provide(infra));
  const queriesLayer = BillingQueriesLive.pipe(Layer.provide(subscriptionLayer));

  return Layer.mergeAll(
    Layer.succeed(CheckoutTokenClient, makeCheckoutTokenService(env)),
    subscriptionLayer,
    queriesLayer
  );
};

export const BillingAuthIntegrationLive = (env: Env) =>
  Layer.effect(
    BillingAuthIntegration,
    Effect.gen(function* () {
      const affiliateRewards = yield* AffiliateRewardService;
      return makeBillingAuthIntegration(env, affiliateRewards);
    })
  );
