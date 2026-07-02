import { Context, Effect } from "effect";
import type { UnknownError } from "effect/Cause";

export interface WeeklyUsage {
  spokenWords: number;
  transformedWords: number;
  totalWords: number;
}

export interface UsageReaderService {
  getCurrentWeeklyUsage: (userId: string) => Effect.Effect<WeeklyUsage, UnknownError>;
}

export class UsageReader extends Context.Service<UsageReader, UsageReaderService>()(
  "UsageReader"
) {}
