import { useCallback, useEffect, useRef, useState } from "react";

type Mode = "idle" | "recording" | "processing";

type UseMinimizedPillInput = {
  mode: Mode;
  isToastVisible: boolean;
};

type UseMinimizedPillOutput = {
  isExpanded: boolean;
  handlers: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
  };
};

const COLLAPSE_GRACE_MS = 300;

export function useMinimizedPill({
  mode,
  isToastVisible,
}: UseMinimizedPillInput): UseMinimizedPillOutput {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const prevModeRef = useRef(mode);
  useEffect(() => {
    const prev = prevModeRef.current;
    prevModeRef.current = mode;
    if (prev !== "idle" && mode === "idle") {
      setHovered(false);
      setFocused(false);
    }
  }, [mode]);

  const isActiveLocked = mode !== "idle";
  const isExpanded = hovered || focused || isActiveLocked || isToastVisible;

  const onMouseEnter = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    setHovered(true);
  }, []);

  const onMouseLeave = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => setHovered(false), COLLAPSE_GRACE_MS);
  }, []);

  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);

  useEffect(() => {
    return () => {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    };
  }, []);

  return {
    isExpanded,
    handlers: { onMouseEnter, onMouseLeave, onFocus, onBlur },
  };
}
