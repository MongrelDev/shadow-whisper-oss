const WARMED_SESSION_KEY = "warmedSessionId";

export function saveWarmedSessionId(sessionId: string): Promise<void> {
  return chrome.storage.session.set({ [WARMED_SESSION_KEY]: sessionId });
}

export function clearWarmedSessionId(): Promise<void> {
  return chrome.storage.session.remove(WARMED_SESSION_KEY);
}

export async function readWarmedSessionId(): Promise<string | undefined> {
  const result = (await chrome.storage.session.get(WARMED_SESSION_KEY)) as {
    warmedSessionId?: string;
  };
  return result.warmedSessionId;
}
