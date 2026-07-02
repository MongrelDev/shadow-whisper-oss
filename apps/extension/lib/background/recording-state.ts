import type { RecordingState } from "~/lib/messaging/types";
import { replyToTab } from "~/lib/background/tabs";

const STORAGE_KEY = "recordingState";

export function applyBadge(state: RecordingState): void {
  if (state === "recording") {
    chrome.action.setBadgeText({ text: "●" });
    chrome.action.setBadgeBackgroundColor({ color: "#E53E3E" });
  } else if (state === "processing") {
    chrome.action.setBadgeText({ text: "…" });
    chrome.action.setBadgeBackgroundColor({ color: "#718096" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

function broadcastStateToAllTabs(state: RecordingState): void {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.id !== undefined) {
        replyToTab(tab.id, { target: "content", type: "bg:state-sync", state });
      }
    }
  });
}

export function setRecordingState(state: RecordingState): void {
  chrome.storage.session.set({ [STORAGE_KEY]: state }, () => {
    applyBadge(state);
    chrome.runtime.sendMessage({ target: "sidepanel", type: "bg:state-sync", state }).catch(() => {
      // Side panel may not be open; ignore.
    });
    broadcastStateToAllTabs(state);
  });
}

export function getRecordingState(cb: (state: RecordingState) => void): void {
  chrome.storage.session.get([STORAGE_KEY], (result) => {
    cb((result[STORAGE_KEY] as RecordingState) ?? "idle");
  });
}
