import { Context, Effect } from "effect";
import type { AffiliateReferral } from "../../domain/affiliate-referral";
import type { IsoDateTime } from "../../domain/time";
import type { AffiliateDatabaseError, DuplicateReferralError } from "../../errors";

export interface ReferralWriterInput {
  readonly referral: {
    readonly referrerUserId: string;
    readonly referredUserId: string;
    readonly affiliateCode: string;
    readonly source: AffiliateReferral["source"];
    readonly status: Extract<AffiliateReferral["status"], "pending">;
    readonly benefitType: AffiliateReferral["benefitType"];
    readonly benefitStartedAt: IsoDateTime | null;
    readonly benefitEndsAt: IsoDateTime | null;
  };
}

export interface ReferralWriterResult {
  readonly referral: AffiliateReferral;
}

export interface ReferralWriterService {
  readonly createReferral: (
    input: ReferralWriterInput
  ) => Effect.Effect<ReferralWriterResult, AffiliateDatabaseError | DuplicateReferralError>;
}

export class ReferralWriter extends Context.Service<ReferralWriter, ReferralWriterService>()(
  "ReferralWriter"
) {}
