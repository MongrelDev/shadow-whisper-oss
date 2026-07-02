import { Context, type Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import type { RecordUsageResult } from "../../domain/usage-analytics";
import type { UsageTrackerError } from "../../errors";

export interface UsageEntry {
  readonly id: string;
  readonly wordCount: number;
  readonly inputWordCount: number | null;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
  readonly surfaceContext: SurfaceContext | null;
  readonly engines: { stt: string; llm: string | null };
  readonly durationMs: number;
  readonly createdAt: number;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly language: string | null;
  readonly timezone: string;
}

export interface UsageTrackerService {
  readonly record: (entry: UsageEntry) => Effect.Effect<RecordUsageResult, UsageTrackerError>;
}

export class UsageTracker extends Context.Service<UsageTracker, UsageTrackerService>()(
  "UsageTracker"
) {}
