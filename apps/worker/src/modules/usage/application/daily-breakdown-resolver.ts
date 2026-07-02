import { Effect } from "effect";
import type { AppCategoryRepositoryService } from "../../transcription/application/ports/app-category-repository";
import type { AppRegistryEntry } from "../../transcription/domain/app-category";
import type { DailyBreakdownItem } from "../schemas";
import {
  deriveDisplayName,
  OUTROS_HOST_NAME,
  UNCATEGORIZED_CATEGORY,
  type DailyBreakdownRow,
} from "../domain/usage-analytics";

const normalize = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

// Both identifiers are carried in one key (bundle + host, newline-separated) so the
// registry can apply site-first resolution: a recognized host wins, otherwise the
// companion bundleId's app category is used.
const identifierKeyOf = (row: DailyBreakdownRow): string | null => {
  const host = normalize(row.siteHost);
  const bundle = normalize(row.bundleId);
  if (!host && !bundle) return null;
  return `${bundle ?? ""}\n${host ?? ""}`;
};

const collectIdentifierKeys = (rows: ReadonlyArray<DailyBreakdownRow>): ReadonlyArray<string> => {
  const set = new Set<string>();
  for (const row of rows) {
    const key = identifierKeyOf(row);
    if (key) set.add(key);
  }
  return Array.from(set);
};

const resolveIdentifiers = Effect.fnUntraced(function* (
  registry: AppCategoryRepositoryService,
  keys: ReadonlyArray<string>
) {
  const resolved = new Map<string, AppRegistryEntry | null>();
  yield* Effect.forEach(
    keys,
    (key) =>
      Effect.gen(function* () {
        const [bundle, host] = key.split("\n");
        const hit = yield* registry.resolve({
          bundleId: bundle ?? "",
          host: host && host.length > 0 ? host : null,
        });
        resolved.set(key, hit);
      }),
    { concurrency: 10 }
  );
  return resolved;
});

const mergeKeyFor = (row: DailyBreakdownRow, hit: AppRegistryEntry | null): string => {
  if (hit) {
    return `${row.localDate}|${row.platform}|${row.os}|${hit.hostName}|${hit.category}`;
  }
  return `${row.localDate}|${row.platform}|${row.os}|${OUTROS_HOST_NAME}|${UNCATEGORIZED_CATEGORY}`;
};

const accumulate = (
  acc: Map<string, DailyBreakdownItem>,
  row: DailyBreakdownRow,
  hit: AppRegistryEntry | null
): void => {
  const { hostName, category } = deriveDisplayName(hit);
  const key = mergeKeyFor(row, hit);
  const existing = acc.get(key);
  if (existing) {
    acc.set(key, {
      ...existing,
      wordCount: existing.wordCount + row.wordCount,
      durationMs: existing.durationMs + row.durationMs,
      entryCount: existing.entryCount + row.entryCount,
    });
    return;
  }
  acc.set(key, {
    localDate: row.localDate,
    platform: row.platform,
    os: row.os,
    hostName,
    category,
    wordCount: row.wordCount,
    durationMs: row.durationMs,
    entryCount: row.entryCount,
  });
};

export const resolveDailyBreakdownItems = Effect.fnUntraced(function* (
  rows: ReadonlyArray<DailyBreakdownRow>,
  registry: AppCategoryRepositoryService
) {
  const keys = collectIdentifierKeys(rows);
  const resolved = yield* resolveIdentifiers(registry, keys);
  const merged = new Map<string, DailyBreakdownItem>();
  for (const row of rows) {
    const key = identifierKeyOf(row);
    const hit = key ? (resolved.get(key) ?? null) : null;
    accumulate(merged, row, hit);
  }
  return Array.from(merged.values()) as ReadonlyArray<DailyBreakdownItem>;
});
