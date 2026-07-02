import { useEffect, useState } from "react";
import type { BackgroundMessage, RecordingState } from "~/lib/messaging/types";

export function useRecordingState(): RecordingState {
  const [state, setState] = useState<RecordingState>("idle");

  useEffect(() => {
    chrome.storage.session.get(["recordingState"], (result) => {
      setState((result["recordingState"] as RecordingState) ?? "idle");
    });

    const listener = (msg: unknown) => {
      const message = msg as BackgroundMessage;
      if (
        message.type === "bg:state-sync" &&
        (message.target === "sidepanel" || message.target === "content")
      ) {
        setState(message.state);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  return state;
}
