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
import {
  collectIdentifierKeys,
  identifierKeyOf,
  resolveIdentifiers,
} from "./app-identifier-resolution";

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
