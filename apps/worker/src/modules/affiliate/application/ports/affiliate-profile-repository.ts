import { Context, Effect } from "effect";
import type { AffiliateProfile } from "../../domain/affiliate-profile";
import type { IsoDateTime } from "../../domain/time";
import type { AffiliateDatabaseError } from "../../errors";

export interface AffiliateProfileRepositoryService {
  readonly findByUserId: (
    userId: string
  ) => Effect.Effect<AffiliateProfile | null, AffiliateDatabaseError>;
  readonly findByCode: (
    code: string
  ) => Effect.Effect<AffiliateProfile | null, AffiliateDatabaseError>;
  readonly create: (profile: {
    readonly userId: string;
    readonly code: string;
    readonly isActive: boolean;
  }) => Effect.Effect<AffiliateProfile, AffiliateDatabaseError>;
  readonly updateActiveByUserId: (
    userId: string,
    isActive: boolean,
    updatedAt: IsoDateTime
  ) => Effect.Effect<void, AffiliateDatabaseError>;
  readonly codeExists: (code: string) => Effect.Effect<boolean, AffiliateDatabaseError>;
}

export class AffiliateProfileRepository extends Context.Service<
  AffiliateProfileRepository,
  AffiliateProfileRepositoryService
>()("AffiliateProfileRepository") {}
