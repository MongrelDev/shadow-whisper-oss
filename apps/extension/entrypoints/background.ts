import { queryOffscreenStatus } from "~/lib/background/offscreen-status";
import { loadPrefs, watchPrefs } from "~/lib/background/prefs";
import { applyBadge, getRecordingState, setRecordingState } from "~/lib/background/recording-state";
import { replyToTab } from "~/lib/background/tabs";
import {
  handleRecordingCommand,
  type InboundMessage,
  routeInboundMessage,
} from "~/lib/background/message-router";
import {
  handleToggleRecording,
  resumePendingTranscription,
} from "~/lib/background/transcription-controller";
import { buildContextMenu, handleContextMenuClick } from "~/lib/background/context-menu";

type E2EMessage =
  | {
      target: "background:e2e";
      type: "e2e:context-menu-click";
      menuItemId: string;
      selectionText?: string;
    }
  | { target: "background:e2e"; type: "e2e:toggle-recording" };

function isE2EMessage(msg: unknown): msg is E2EMessage {
  if (import.meta.env.VITE_E2E !== "1") return false;
  if (typeof msg !== "object" || msg === null) return false;
  return (msg as { target?: unknown }).target === "background:e2e";
}

function routeE2EMessage(msg: E2EMessage): void {
  if (msg.type === "e2e:context-menu-click") {
    handleContextMenuClick({
      menuItemId: msg.menuItemId,
      selectionText: msg.selectionText,
      editable: false,
      pageUrl: "",
    } as chrome.contextMenus.OnClickData);
    return;
  }

  if (msg.type === "e2e:toggle-recording") {
    handleToggleRecording();
  }
}

if (import.meta.env.VITE_E2E === "1") {
  (
    globalThis as typeof globalThis & {
      __shadowWhisperE2E?: (msg: E2EMessage) => void;
    }
  ).__shadowWhisperE2E = routeE2EMessage;
}

function restoreRecordingState(): void {
  void resumePendingTranscription().then(() => {
    getRecordingState((state) => {
      applyBadge(state);
      if (state === "recording") {
        void queryOffscreenStatus().then((stillRecording) => {
          if (!stillRecording) {
            setRecordingState("idle");
          }
        });
      }
    });
  });
}

export default defineBackground(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  chrome.storage.session
    .setAccessLevel({ accessLevel: "TRUSTED_AND_UNTRUSTED_CONTEXTS" })
    .catch((err) => console.error("[bg] storage.session.setAccessLevel failed", err));

  loadPrefs();
  watchPrefs();

  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === "start-recording") {
      handleRecordingCommand(tab);
    }
  });

  chrome.runtime.onMessage.addListener((msg, sender) => {
    if (isE2EMessage(msg)) {
      routeE2EMessage(msg);
      return;
    }
    routeInboundMessage(msg as InboundMessage, sender);
  });

  chrome.tabs.onActivated.addListener(({ tabId }) => {
    getRecordingState((state) => {
      replyToTab(tabId, { target: "content", type: "bg:state-sync", state });
    });
  });

  chrome.contextMenus.onClicked.addListener(handleContextMenuClick);
  void buildContextMenu();

  restoreRecordingState();
});
