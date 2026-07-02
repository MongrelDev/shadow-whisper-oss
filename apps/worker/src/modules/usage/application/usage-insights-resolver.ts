import { Effect } from "effect";
import type { AppCategoryRepositoryService } from "../../transcription/application/ports/app-category-repository";
import type { UsageInsights } from "./usage-ledger-operations";
import type { InsightAppItem, InsightCategoryItem, UsageInsightsResponse } from "../schemas";
import {
  deriveDisplayName,
  OUTROS_HOST_NAME,
  UNCATEGORIZED_CATEGORY,
} from "../domain/usage-analytics";
import {
  collectIdentifierKeys,
  identifierKeyOf,
  resolveIdentifiers,
} from "./app-identifier-resolution";

const TOP_APPS_LIMIT = 10;

const pctOf = (part: number, whole: number): number =>
  whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;

interface MutableAggregate {
  wordCount: number;
  entryCount: number;
}

const accumulateInto = (
  acc: Map<string, MutableAggregate>,
  key: string,
  row: UsageInsights["apps"][number]
): void => {
  const existing = acc.get(key) ?? { wordCount: 0, entryCount: 0 };
  existing.wordCount += row.wordCount;
  existing.entryCount += row.entryCount;
  acc.set(key, existing);
};

export const resolveUsageInsights = Effect.fnUntraced(function* (
  insights: UsageInsights,
  range: { from: string | null; to: string | null },
  registry: AppCategoryRepositoryService
) {
  const keys = collectIdentifierKeys(insights.apps);
  const resolved = yield* resolveIdentifiers(registry, keys);

  const byCategory = new Map<string, MutableAggregate>();
  const byApp = new Map<string, MutableAggregate & { category: string }>();

  for (const row of insights.apps) {
    const key = identifierKeyOf(row);
    const hit = key ? (resolved.get(key) ?? null) : null;
    const { hostName, category } = hit
      ? deriveDisplayName(hit)
      : { hostName: OUTROS_HOST_NAME, category: UNCATEGORIZED_CATEGORY };

    accumulateInto(byCategory, category, row);
    const appAcc = byApp.get(hostName) ?? { wordCount: 0, entryCount: 0, category };
    appAcc.wordCount += row.wordCount;
    appAcc.entryCount += row.entryCount;
    byApp.set(hostName, appAcc);
  }

  const totalWords = insights.totals.wordCount;
  const categories = Array.from(
    byCategory,
    ([category, agg]): InsightCategoryItem => ({
      category,
      wordCount: agg.wordCount,
      entryCount: agg.entryCount,
      pctWords: pctOf(agg.wordCount, totalWords),
    })
  ).sort((a, b) => b.wordCount - a.wordCount);

  const topApps = Array.from(
    byApp,
    ([hostName, agg]): InsightAppItem => ({
      hostName,
      category: agg.category,
      wordCount: agg.wordCount,
      entryCount: agg.entryCount,
      pctWords: pctOf(agg.wordCount, totalWords),
    })
  )
    .sort((a, b) => b.wordCount - a.wordCount)
    .slice(0, TOP_APPS_LIMIT);

  return {
    from: range.from,
    to: range.to,
    totals: { ...insights.totals, distinctApps: keys.length },
    categories,
    topApps,
    platforms: insights.platforms.map((p) => ({
      key: p.key,
      wordCount: p.wordCount,
      entryCount: p.entryCount,
    })),
    languages: insights.languages.map((l) => ({
      key: l.key,
      wordCount: l.wordCount,
      entryCount: l.entryCount,
    })),
    hours: insights.hours.map((h) => ({
      hour: h.hour,
      wordCount: h.wordCount,
      entryCount: h.entryCount,
    })),
  } satisfies UsageInsightsResponse;
});
