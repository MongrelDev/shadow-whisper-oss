import { useEffect, useState } from "react";
import type { HeatmapState } from "../types";

const STORAGE_KEY = "sw_heatmap_state";
const DEFAULT_STATE: HeatmapState = { scrollOffsetDays: 0 };

function readInitial(): HeatmapState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...(JSON.parse(raw) as Partial<HeatmapState>) };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useHeatmapState() {
  const [state, setState] = useState<HeatmapState>(readInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const update = (patch: Partial<HeatmapState>) => setState((prev) => ({ ...prev, ...patch }));
  return { state, update, hydrated: true as const };
}
