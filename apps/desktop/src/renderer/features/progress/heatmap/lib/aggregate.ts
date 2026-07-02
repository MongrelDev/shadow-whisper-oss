import type { DailyBreakdownItem } from "@whisper/api";

export interface AppAggregate {
  hostName: string;
  category: string;
  wordCount: number;
  durationMs: number;
  entryCount: number;
}

export function aggregateByHost(items: ReadonlyArray<DailyBreakdownItem>): AppAggregate[] {
  const byHost = new Map<string, AppAggregate>();
  for (const item of items) {
    const existing = byHost.get(item.hostName);
    if (existing) {
      existing.wordCount += item.wordCount;
      existing.durationMs += item.durationMs;
      existing.entryCount += item.entryCount;
    } else {
      byHost.set(item.hostName, {
        hostName: item.hostName,
        category: item.category,
        wordCount: item.wordCount,
        durationMs: item.durationMs,
        entryCount: item.entryCount,
      });
    }
  }
  return Array.from(byHost.values()).sort((a, b) => b.wordCount - a.wordCount);
}

export interface PlatformGroup {
  platform: string;
  os: string;
  apps: AppAggregate[];
  totalWordCount: number;
}

export function groupByPlatformOs(items: ReadonlyArray<DailyBreakdownItem>): PlatformGroup[] {
  const byKey = new Map<string, DailyBreakdownItem[]>();
  for (const item of items) {
    const key = `${item.platform}|${item.os}`;
    const arr = byKey.get(key) ?? [];
    arr.push(item);
    byKey.set(key, arr);
  }
  const groups: PlatformGroup[] = Array.from(byKey.entries()).map(([key, groupItems]) => {
    const [platform, os] = key.split("|");
    const apps = aggregateByHost(groupItems);
    return {
      platform: platform ?? "unknown",
      os: os ?? "unknown",
      apps,
      totalWordCount: apps.reduce((acc, a) => acc + a.wordCount, 0),
    };
  });
  const platformOrder: Record<string, number> = { desktop: 0, extension: 1 };
  groups.sort((a, b) => {
    const pa = platformOrder[a.platform] ?? 99;
    const pb = platformOrder[b.platform] ?? 99;
    if (pa !== pb) return pa - pb;
    return a.os.localeCompare(b.os);
  });
  return groups;
}

export function topAppsWithOther(
  aggregates: AppAggregate[],
  topN: number
): { top: AppAggregate[]; other: AppAggregate | null } {
  if (aggregates.length <= topN) return { top: aggregates, other: null };
  const top = aggregates.slice(0, topN);
  const rest = aggregates.slice(topN);
  const other: AppAggregate = {
    hostName: "other",
    category: "other",
    wordCount: rest.reduce((acc, a) => acc + a.wordCount, 0),
    durationMs: rest.reduce((acc, a) => acc + a.durationMs, 0),
    entryCount: rest.reduce((acc, a) => acc + a.entryCount, 0),
  };
  return { top, other };
}
