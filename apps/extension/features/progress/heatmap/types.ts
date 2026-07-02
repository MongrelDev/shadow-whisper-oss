import type { DailyBreakdownItem } from "@whisper/api";

export interface DayCell {
  localDate: string;
  wordCount: number;
  durationMs: number;
  entryCount: number;
  items: DailyBreakdownItem[];
}

export interface HeatmapWeek {
  cells: (DayCell | null)[];
}

export interface HeatmapState {
  scrollOffsetDays: number;
}
