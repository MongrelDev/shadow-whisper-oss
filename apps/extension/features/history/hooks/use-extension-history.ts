import { useEffect, useState } from "react";
import { liveQuery } from "dexie";
import { getExtensionHistory, type ExtensionHistoryEntry } from "../lib/history-storage";

export function useExtensionHistory(): ExtensionHistoryEntry[] {
  const [history, setHistory] = useState<ExtensionHistoryEntry[]>([]);

  useEffect(() => {
    const subscription = liveQuery(() => getExtensionHistory()).subscribe({
      next: setHistory,
      error: () => setHistory([]),
    });

    return () => subscription.unsubscribe();
  }, []);

  return history;
}
