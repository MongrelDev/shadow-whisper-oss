import { env } from "cloudflare:workers";
import { Effect, Layer } from "effect";
import { D1SqlLive } from "../../src/platform/cloudflare/d1/sql-client";
import {
  UsageLedger,
  type LedgerSkillUsageInput,
  type UsageLedgerServiceShape,
} from "../../src/modules/usage/application/usage-ledger-service";
import type { RecordUsageInput } from "../../src/modules/usage/application/usage-ledger-operations";
import { UsageLedgerLive } from "../../src/modules/usage/infra/usage-ledger-live";
import { PendingSuggestionsRepository } from "../../src/modules/feedback/application/ports/pending-suggestions-repository";
import { PendingSuggestionsRepositoryLive } from "../../src/modules/feedback/infra/live";
import { LearnedWordRepository } from "../../src/modules/whisper-memory/application/ports/learned-word-repository";
import { LearnedWordRepositoryLive } from "../../src/modules/whisper-memory/infra/learned-word-repository-live";

const ledgerLayer = () => UsageLedgerLive.pipe(Layer.provide(D1SqlLive(env)));

const withLedger = <A>(
  f: (ledger: UsageLedgerServiceShape) => Effect.Effect<A, unknown>
): Promise<A> =>
  Effect.runPromise(
    Effect.gen(function* () {
      const ledger = yield* UsageLedger;
      return yield* f(ledger);
    }).pipe(Effect.provide(ledgerLayer())) as Effect.Effect<A>
  );

export const recordUsageFor = (userId: string, input: RecordUsageInput) =>
  withLedger((ledger) => ledger.recordUsage(userId, input));

export const appendSkillUsageFor = (userId: string, input: LedgerSkillUsageInput) =>
  withLedger((ledger) => ledger.appendSkillUsage(userId, input));

export const getUserStatsFor = (userId: string) =>
  withLedger((ledger) => ledger.getUserStats(userId));

export const getDailyBreakdownFor = (userId: string, fromLocalDate: string, toLocalDate: string) =>
  withLedger((ledger) => ledger.getDailyBreakdown(userId, fromLocalDate, toLocalDate));

export const getWeeklyWordCountFor = (userId: string, weekStartMs: number, weekEndMs: number) =>
  withLedger((ledger) => ledger.getWeeklyWordCount(userId, weekStartMs, weekEndMs));

export interface SeedPendingSuggestionInput {
  readonly feedbackId: string;
  readonly original: string;
  readonly replacement: string;
  readonly context: string;
  readonly selectedText: string;
  readonly source: string;
  readonly matchedSessionId: string | null;
  readonly now: number;
}

export const createPendingSuggestionFor = (userId: string, input: SeedPendingSuggestionInput) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* PendingSuggestionsRepository;
      return yield* repo.create(userId, input);
    }).pipe(Effect.provide(PendingSuggestionsRepositoryLive(env)))
  );

export const findLearnedWordBySourceFor = (userId: string, source: string) =>
  Effect.runPromise(
    Effect.gen(function* () {
      const repo = yield* LearnedWordRepository;
      return yield* repo.findBySource(source);
    }).pipe(Effect.provide(LearnedWordRepositoryLive(env, userId)))
  );
