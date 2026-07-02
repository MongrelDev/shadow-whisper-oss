import { useCallback, useRef } from "react";
import type { WarmupIpcResult } from "../../../../shared/ipc-types";

export interface UseWarmupSessionReturn {
  warmup: () => Promise<WarmupIpcResult>;
}

export function useWarmupSession(): UseWarmupSessionReturn {
  const inflightRef = useRef<Promise<WarmupIpcResult> | null>(null);

  const warmup = useCallback((): Promise<WarmupIpcResult> => {
    if (inflightRef.current) return inflightRef.current;
    const promise = window.api.session.warmup().finally(() => {
      inflightRef.current = null;
    });
    inflightRef.current = promise;
    return promise;
  }, []);

  return { warmup };
}
