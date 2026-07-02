import { Context, type Effect } from "effect";
import type {
  AchievementRow,
  MilestoneRow,
  RecordUsageResult,
  UserStats,
} from "../domain/usage-analytics";
import type { UsageLedgerStorageError } from "../errors";
import type { DailyBreakdownRow } from "./ports/ledger-stores";
import type { RecordUsageInput, ShareCardStats, UsageInsights } from "./usage-ledger-operations";

export interface LedgerSkillUsageInput {
  readonly skillId: string;
  readonly skillVersion: number;
  readonly inputWordCount: number;
  readonly outputWordCount: number;
  readonly durationMs: number;
  readonly success: boolean;
  readonly bundleId?: string;
  readonly siteHost?: string;
  readonly surfaceContext?: string;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly language: string | null;
  readonly timezone: string;
}

export interface InsightsRangeInput {
  readonly fromLocalDate: string | null;
  readonly toLocalDate: string | null;
}

type E<A> = Effect.Effect<A, UsageLedgerStorageError>;

export interface UsageLedgerServiceShape {
  readonly recordUsage: (userId: string, input: RecordUsageInput) => E<RecordUsageResult>;
  readonly appendSkillUsage: (userId: string, input: LedgerSkillUsageInput) => E<void>;
  readonly getWeeklyWordCount: (
    userId: string,
    weekStartMs: number,
    weekEndMs: number
  ) => E<number>;
  readonly getUserStats: (userId: string) => E<UserStats>;
  readonly getShareCardStats: (userId: string) => E<ShareCardStats>;
  readonly getUsageInsights: (userId: string, range: InsightsRangeInput) => E<UsageInsights>;
  readonly getDailyBreakdown: (
    userId: string,
    fromLocalDate: string,
    toLocalDate: string
  ) => E<ReadonlyArray<DailyBreakdownRow>>;
  readonly getAchievementsWithProgress: (userId: string) => E<ReadonlyArray<AchievementRow>>;
  readonly getMilestonesWithProgress: (userId: string) => E<ReadonlyArray<MilestoneRow>>;
}

export class UsageLedger extends Context.Service<UsageLedger, UsageLedgerServiceShape>()(
  "UsageLedger"
) {}
