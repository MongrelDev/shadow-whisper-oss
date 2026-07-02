export function replyToTab(tabId: number, payload: Record<string, unknown>): void {
  chrome.tabs.sendMessage(tabId, payload).catch(() => {});
}
