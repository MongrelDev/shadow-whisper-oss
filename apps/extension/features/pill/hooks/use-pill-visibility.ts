import { useEffect, useState } from "react";
import type { PillVisibilityMessage } from "~/lib/messaging/types";

export function usePillVisibility(): boolean {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    chrome.runtime
      .sendMessage({ target: "background", type: "content:pill-ready" })
      .catch(() => {});

    const onMessage = (msg: unknown) => {
      if (!isPillVisibilityMessage(msg)) return;
      setVisible(msg.visible);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  return visible;
}

function isPillVisibilityMessage(msg: unknown): msg is PillVisibilityMessage {
  return (
    typeof msg === "object" &&
    msg !== null &&
    (msg as { target?: unknown }).target === "content" &&
    (msg as { type?: unknown }).type === "bg:pill-visibility"
  );
}
