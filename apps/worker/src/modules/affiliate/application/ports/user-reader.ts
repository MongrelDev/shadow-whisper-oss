import { Context, Effect } from "effect";
import type { AffiliateDatabaseError } from "../../errors";

export interface UserBillingProfile {
  readonly stripeCustomerId: string | null;
  readonly stripeSubscriptionId: string | null;
}

export interface UserReaderService {
  readonly getEmailByUserId: (
    userId: string
  ) => Effect.Effect<string | null, AffiliateDatabaseError>;
  readonly getUserIdByEmail: (
    email: string
  ) => Effect.Effect<string | null, AffiliateDatabaseError>;
  readonly getBillingProfile: (
    userId: string
  ) => Effect.Effect<UserBillingProfile, AffiliateDatabaseError>;
  readonly getUserIdByStripeCustomerId: (
    stripeCustomerId: string
  ) => Effect.Effect<string | null, AffiliateDatabaseError>;
}

export class UserReader extends Context.Service<UserReader, UserReaderService>()(
  "AffiliateUserReader"
) {}
