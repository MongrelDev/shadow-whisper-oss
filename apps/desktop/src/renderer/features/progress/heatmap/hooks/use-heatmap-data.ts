import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ipcCall } from "~/lib/ipc";
import type { DailyBreakdownResponse } from "@whisper/api";
import type { DayCell, HeatmapWeek } from "../types";
import { gapFill, shiftUtcDays, toUtcDateString, toWeeks } from "../lib/calendar";

export const USAGE_DAILY_QUERY_KEY = ["usage", "daily"] as const;

const DAYS_WINDOW = 371;

export function useHeatmapData() {
  const today = toUtcDateString(new Date());
  const from = shiftUtcDays(today, -(DAYS_WINDOW - 1));

  const query = useQuery({
    queryKey: [...USAGE_DAILY_QUERY_KEY, { from, to: today }] as const,
    queryFn: (): Promise<DailyBreakdownResponse> =>
      ipcCall(() => window.api.usage.getDaily({ from, to: today }), "Failed to load heatmap"),
    staleTime: 5 * 60 * 1000,
  });

  const days: DayCell[] = useMemo(
    () => (query.data ? gapFill(query.data.items, query.data.from, query.data.to) : []),
    [query.data]
  );

  const weeks: HeatmapWeek[] = useMemo(() => toWeeks(days), [days]);
  const achievementDates = useMemo(() => new Set(query.data?.achievementDates ?? []), [query.data]);

  return { ...query, days, weeks, achievementDates, from, to: today };
}
