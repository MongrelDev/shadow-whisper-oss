import type { IsoDateTime } from "./time";

export interface AffiliateProfile {
  readonly id: number;
  readonly userId: string;
  readonly code: string;
  readonly isActive: boolean;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}
