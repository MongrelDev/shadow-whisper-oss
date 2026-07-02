import { useCallback, useEffect, useReducer } from "react";
import { isContentTranscriptMessage } from "~/lib/messaging/transcript-guards";

type PillTranscriptState =
  | { status: "idle" }
  | { status: "ready"; text: string; receivedAt: number }
  | { status: "error"; code: string };

type PillTranscriptAction =
  | { type: "received"; text: string; receivedAt: number }
  | { type: "error"; code: string }
  | { type: "clear" };

const QUOTA_ERROR_CODES = new Set(["quota_exceeded", "er_limit_exceeded"]);

function reducer(_state: PillTranscriptState, action: PillTranscriptAction): PillTranscriptState {
  switch (action.type) {
    case "received":
      return { status: "ready", text: action.text, receivedAt: action.receivedAt };
    case "error":
      return { status: "error", code: action.code };
    case "clear":
      return { status: "idle" };
  }
}

export function usePillTranscript() {
  const [state, dispatch] = useReducer(reducer, { status: "idle" });

  useEffect(() => {
    const listener = (msg: unknown) => {
      if (!isContentTranscriptMessage(msg)) return;
      if (msg.type === "bg:transcript-final") {
        dispatch({ type: "received", text: msg.text, receivedAt: Date.now() });
      } else if (msg.type === "bg:transcript-error") {
        dispatch({ type: "error", code: msg.code });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const error = state.status === "error" ? state.code : null;

  return {
    transcript: state.status === "ready" ? state.text : null,
    receivedAt: state.status === "ready" ? state.receivedAt : null,
    error,
    isQuotaExceeded: error !== null && QUOTA_ERROR_CODES.has(error),
    clear,
  };
}
