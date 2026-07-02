import { Effect, Layer } from "effect";
import Stripe from "stripe";
import { createDb } from "@whisper/db";
import { AuthService } from "../../auth/server";
import { AffiliateProfileRepository } from "../application/ports/affiliate-profile-repository";
import { ReferralRepository } from "../application/ports/referral-repository";
import { RewardRepository } from "../application/ports/reward-repository";
import { UserReader } from "../application/ports/user-reader";
import { AuthSignup } from "../application/ports/auth-signup";
import { ReferralWriter } from "../application/ports/referral-writer";
import { StripeRewardClient } from "../application/ports/stripe-reward-client";
import { AffiliateBatchWriter } from "../application/ports/affiliate-batch-writer";
import { AffiliateServiceLive } from "../application/affiliate-service";
import { AffiliateRewardServiceLive } from "../application/affiliate-reward-service";
import { makeDrizzleAffiliateProfileRepository } from "./affiliate-profile-repository";
import { makeDrizzleReferralRepository } from "./referral-repository";
import { makeDrizzleRewardRepository } from "./reward-repository";
import { makeDrizzleUserReader } from "./user-reader";
import { makeAuthSignup } from "./auth-signup";
import { makeDrizzleReferralWriter } from "./referral-writer";
import { makeStripeRewardClient } from "./stripe-reward-client";
import { makeDrizzleAffiliateBatchWriter } from "./affiliate-batch-writer";

const AffiliateCoreInfrastructureLive = (env: Env) => {
  const db = createDb(env.DB);
  const stripeClient = new Stripe(env.STRIPE_SECRET_KEY);

  return Layer.mergeAll(
    Layer.succeed(AffiliateProfileRepository, makeDrizzleAffiliateProfileRepository(db)),
    Layer.succeed(ReferralRepository, makeDrizzleReferralRepository(db)),
    Layer.succeed(RewardRepository, makeDrizzleRewardRepository(db)),
    Layer.succeed(UserReader, makeDrizzleUserReader(db)),
    Layer.succeed(ReferralWriter, makeDrizzleReferralWriter(db)),
    Layer.succeed(AffiliateBatchWriter, makeDrizzleAffiliateBatchWriter(db)),
    Layer.succeed(StripeRewardClient, makeStripeRewardClient(stripeClient))
  );
};

const AffiliateAuthSignupLive = Layer.effect(
  AuthSignup,
  Effect.gen(function* () {
    const auth = yield* AuthService;
    return makeAuthSignup(auth);
  })
);

const AffiliateInfrastructureLive = (env: Env) =>
  Layer.mergeAll(AffiliateCoreInfrastructureLive(env), AffiliateAuthSignupLive);

export const AffiliateRewardsLive = (env: Env) =>
  AffiliateRewardServiceLive.pipe(Layer.provide(AffiliateCoreInfrastructureLive(env)));

export const AffiliateLive = (env: Env) => {
  const infra = AffiliateInfrastructureLive(env);
  const services = AffiliateServiceLive.pipe(Layer.provide(infra));
  return Layer.mergeAll(infra, services);
};
