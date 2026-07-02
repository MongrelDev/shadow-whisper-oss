import { useDeferredValue, useMemo, useState } from "react";
import type { ExtensionHistoryEntry } from "../lib/history-storage";

export function useHistorySearch(entries: ExtensionHistoryEntry[]) {
  const [query, setQuery] = useState("");
  const debounced = useDeferredValue(query);

  const filtered = useMemo(() => {
    if (debounced.trim() === "") return entries;
    const lower = debounced.toLowerCase();
    return entries.filter(
      (e) =>
        e.formattedText.toLowerCase().includes(lower) || e.rawText.toLowerCase().includes(lower)
    );
  }, [entries, debounced]);

  const isFiltering = debounced.trim().length > 0;

  return { query, setQuery, filtered, isFiltering };
}
