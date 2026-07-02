let pendingStatusResolver: ((recording: boolean) => void) | null = null;

export function resolveOffscreenStatus(recording: boolean): void {
  pendingStatusResolver?.(recording);
}

export function queryOffscreenStatus(timeoutMs = 500): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      pendingStatusResolver = null;
      resolve(false);
    }, timeoutMs);
    pendingStatusResolver = (recording) => {
      clearTimeout(timer);
      pendingStatusResolver = null;
      resolve(recording);
    };
    chrome.runtime.sendMessage({ target: "offscreen", type: "offscreen:get-status" }).catch(() => {
      clearTimeout(timer);
      pendingStatusResolver = null;
      resolve(false);
    });
  });
}
