import type { DailyBreakdownItem } from "@whisper/api";
import type { DayCell, HeatmapWeek } from "../types";

export function toUtcDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function shiftUtcDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return toUtcDateString(d);
}

export function utcDateRange(from: string, to: string): string[] {
  const result: string[] = [];
  let cursor = from;
  while (cursor <= to) {
    result.push(cursor);
    cursor = shiftUtcDays(cursor, 1);
  }
  return result;
}

export function utcDayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T00:00:00Z`).getUTCDay();
}

export function gapFill(
  items: ReadonlyArray<DailyBreakdownItem>,
  from: string,
  to: string
): DayCell[] {
  const byDate = new Map<string, DailyBreakdownItem[]>();
  for (const item of items) {
    const arr = byDate.get(item.localDate) ?? [];
    arr.push(item);
    byDate.set(item.localDate, arr);
  }
  return utcDateRange(from, to).map((date) => {
    const dayItems = byDate.get(date) ?? [];
    return {
      localDate: date,
      wordCount: dayItems.reduce((acc, i) => acc + i.wordCount, 0),
      durationMs: dayItems.reduce((acc, i) => acc + i.durationMs, 0),
      entryCount: dayItems.reduce((acc, i) => acc + i.entryCount, 0),
      items: dayItems,
    };
  });
}

function padLeading(firstDow: number): (DayCell | null)[] {
  const padding: (DayCell | null)[] = [];
  for (let i = 0; i < firstDow; i++) padding.push(null);
  return padding;
}

function padTrailing(week: (DayCell | null)[]): (DayCell | null)[] {
  const filled = [...week];
  while (filled.length < 7) filled.push(null);
  return filled;
}

export function toWeeks(days: DayCell[]): HeatmapWeek[] {
  const first = days[0];
  if (!first) return [];
  const weeks: HeatmapWeek[] = [];
  let current: (DayCell | null)[] = padLeading(utcDayOfWeek(first.localDate));

  for (const day of days) {
    current.push(day);
    if (current.length === 7) {
      weeks.push({ cells: current });
      current = [];
    }
  }
  if (current.length > 0) {
    weeks.push({ cells: padTrailing(current) });
  }
  return weeks;
}
