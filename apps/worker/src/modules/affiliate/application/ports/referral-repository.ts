import { Context, Effect } from "effect";
import type {
  AffiliateReferral,
  BenefitType,
  ReferralSource,
  ReferralStatus,
} from "../../domain/affiliate-referral";
import type { IsoDateTime } from "../../domain/time";
import type { AffiliateDatabaseError } from "../../errors";

export interface ReferralWithDetails {
  readonly referredEmail: string;
  readonly referredName: string;
  readonly status: ReferralStatus;
  readonly createdAt: string;
  readonly qualifiedAt: string | null;
  readonly rewardedAt: string | null;
  readonly rewardGranted: boolean;
}

export interface CreateReferralInput {
  readonly referrerUserId: string;
  readonly referredUserId: string;
  readonly affiliateCode: string;
  readonly source: ReferralSource;
  readonly status: ReferralStatus;
  readonly benefitType: BenefitType;
  readonly benefitStartedAt: IsoDateTime | null;
  readonly benefitEndsAt: IsoDateTime | null;
  readonly firstPaidInvoiceId: string | null;
  readonly firstPaidAt: IsoDateTime | null;
  readonly qualifiedAt: IsoDateTime | null;
  readonly rewardedAt: IsoDateTime | null;
  readonly rejectedAt: IsoDateTime | null;
  readonly rejectionReason: string | null;
}

export type UpdateReferralStatusInput = {
  readonly status: ReferralStatus;
  readonly updatedAt: IsoDateTime;
} & Partial<{
  readonly qualifiedAt: IsoDateTime;
  readonly rewardedAt: IsoDateTime;
  readonly rejectedAt: IsoDateTime;
  readonly rejectionReason: string;
  readonly firstPaidInvoiceId: string;
  readonly firstPaidAt: IsoDateTime;
}>;

export interface ReferralRepositoryService {
  readonly findByReferredUserId: (
    userId: string
  ) => Effect.Effect<AffiliateReferral | null, AffiliateDatabaseError>;

  readonly findPendingByReferredUserId: (
    userId: string
  ) => Effect.Effect<AffiliateReferral | null, AffiliateDatabaseError>;

  readonly findByReferrerUserId: (
    userId: string,
    options?: { readonly limit?: number }
  ) => Effect.Effect<readonly AffiliateReferral[], AffiliateDatabaseError>;

  readonly create: (
    referral: CreateReferralInput
  ) => Effect.Effect<AffiliateReferral, AffiliateDatabaseError>;

  readonly updateStatus: (
    id: number,
    update: UpdateReferralStatusInput
  ) => Effect.Effect<void, AffiliateDatabaseError>;

  readonly countByReferrerUserId: (
    userId: string
  ) => Effect.Effect<
    { total: number; qualified: number; rewarded: number },
    AffiliateDatabaseError
  >;

  readonly findByReferrerUserIdWithDetails: (
    userId: string,
    options?: { readonly limit?: number }
  ) => Effect.Effect<readonly ReferralWithDetails[], AffiliateDatabaseError>;
}

export class ReferralRepository extends Context.Service<
  ReferralRepository,
  ReferralRepositoryService
>()("ReferralRepository") {}
