import { useEffect, useState } from "react";
import type { HeatmapState } from "../types";

const STORAGE_KEY = "sw_heatmap_state";

const DEFAULT_STATE: HeatmapState = {
  scrollOffsetDays: 0,
};

export function useHeatmapState() {
  const [state, setState] = useState<HeatmapState>(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const stored = result[STORAGE_KEY] as HeatmapState | undefined;
      if (stored) setState({ ...DEFAULT_STATE, ...stored });
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    chrome.storage.local.set({ [STORAGE_KEY]: state });
  }, [state, hydrated]);

  const update = (patch: Partial<HeatmapState>) => setState((prev) => ({ ...prev, ...patch }));

  return { state, update, hydrated };
}
