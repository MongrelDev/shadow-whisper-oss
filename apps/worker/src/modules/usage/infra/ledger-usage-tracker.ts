import { Effect } from "effect";
import type { AppRegistryCandidatesService } from "../application/ports/app-registry-candidates";
import type { UsageEntry, UsageTrackerService } from "../application/ports/usage-tracker";
import type { UsageLedgerServiceShape } from "../application/usage-ledger-service";
import { UsageTrackerError } from "../errors";

export interface LedgerUsageTrackerDeps {
  readonly userId: string;
  readonly ledger: UsageLedgerServiceShape;
  readonly appRegistryCandidates: AppRegistryCandidatesService;
}

const normalizeIdentifier = (value: string | null): string => {
  if (!value) return "";
  return value.trim().toLowerCase();
};

const resolveCandidate = (
  entry: UsageEntry
): { identifier: string; identifierType: "host" | "bundle" } | null => {
  const host = normalizeIdentifier(entry.siteHost);
  if (host) return { identifier: host, identifierType: "host" };
  const bundle = normalizeIdentifier(entry.bundleId);
  if (bundle) return { identifier: bundle, identifierType: "bundle" };
  return null;
};

const touchCandidate = (deps: LedgerUsageTrackerDeps, entry: UsageEntry) => {
  const candidate = resolveCandidate(entry);
  if (!candidate) return Effect.void;
  return Effect.forkChild(
    deps.appRegistryCandidates
      .touch({
        identifier: candidate.identifier,
        identifierType: candidate.identifierType,
        nowMs: entry.createdAt,
      })
      .pipe(
        Effect.tapError((e) =>
          Effect.logWarning(`usage_tracker.touch_candidate failed: ${e.message}`)
        ),
        Effect.catch(() => Effect.void)
      )
  );
};

export const makeLedgerUsageTracker = (deps: LedgerUsageTrackerDeps): UsageTrackerService => ({
  record: Effect.fnUntraced(function* (entry: UsageEntry) {
    const result = yield* deps.ledger
      .recordUsage(deps.userId, {
        id: entry.id,
        wordCount: entry.wordCount,
        bundleId: entry.bundleId,
        siteHost: entry.siteHost,
        surfaceContext: entry.surfaceContext,
        // @effect-diagnostics-next-line preferSchemaOverJson:off
        enginesJson: JSON.stringify(entry.engines),
        durationMs: entry.durationMs,
        createdAt: entry.createdAt,
        inputWordCount: entry.inputWordCount,
        platform: entry.platform,
        os: entry.os,
        language: entry.language,
        timezone: entry.timezone,
      })
      .pipe(
        Effect.mapError(
          (e) => new UsageTrackerError({ message: `usage_tracker.record failed: ${e.message}` })
        )
      );
    yield* touchCandidate(deps, entry);
    return result;
  }),
});
