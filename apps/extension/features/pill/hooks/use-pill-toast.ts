import { useCallback, useEffect, useReducer, useRef } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastState = {
  message: string | null;
  tone: ToastTone;
};

type Action = { type: "show"; message: string; tone: ToastTone } | { type: "hide" };

function reducer(state: ToastState, action: Action): ToastState {
  if (action.type === "show") return { message: action.message, tone: action.tone };
  return { message: null, tone: state.tone };
}

const INITIAL: ToastState = { message: null, tone: "info" };
const DEFAULT_DURATION_MS = 4000;

export type ShowToast = (message: string, tone: ToastTone, durationMs?: number) => void;

export function usePillToast(): { toast: ToastState; showToast: ShowToast } {
  const [toast, dispatch] = useReducer(reducer, INITIAL);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback<ShowToast>((message, tone, durationMs = DEFAULT_DURATION_MS) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    dispatch({ type: "show", message, tone });
    timerRef.current = setTimeout(() => dispatch({ type: "hide" }), durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { toast, showToast };
}
