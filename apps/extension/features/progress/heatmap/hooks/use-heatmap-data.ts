import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/lib/api-client";
import type { DailyBreakdownResponse } from "@whisper/api";
import type { HeatmapWeek } from "../types";
import { gapFill, shiftUtcDays, toUtcDateString, toWeeks } from "../lib/calendar";

export const USAGE_DAILY_QUERY_KEY = ["usage", "daily"] as const;

const DAYS_WINDOW = 371;

export function useHeatmapData() {
  const today = toUtcDateString(new Date());
  const from = shiftUtcDays(today, -(DAYS_WINDOW - 1));

  const query = useQuery({
    queryKey: [...USAGE_DAILY_QUERY_KEY, { from, to: today }] as const,
    queryFn: async (): Promise<DailyBreakdownResponse> => {
      const res = await apiClient.api.usage.daily.$get({ query: { from, to: today } });
      if (!res.ok) throw new Error(`Failed to fetch heatmap data (${res.status})`);
      return (await res.json()) as DailyBreakdownResponse;
    },
    staleTime: 5 * 60 * 1000,
  });

  const weeks: HeatmapWeek[] = query.data
    ? toWeeks(gapFill(query.data.items, query.data.from, query.data.to))
    : [];
  const achievementDates = new Set(query.data?.achievementDates ?? []);

  return { ...query, weeks, achievementDates, from, to: today };
}
