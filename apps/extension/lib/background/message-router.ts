import type {
  ContentScriptMessage,
  OffscreenOutboundMessage,
  SidePanelMessage,
} from "~/lib/messaging/types";
import { resolveOffscreenStatus } from "~/lib/background/offscreen-status";
import { refreshSkillsContextMenu } from "~/lib/background/context-menu";
import { getBackgroundPrefs } from "~/lib/background/prefs";
import { replyToTab } from "~/lib/background/tabs";
import {
  forwardChunkReady,
  forwardError,
  handleToggleRecording,
} from "~/lib/background/transcription-controller";

export type InboundMessage = OffscreenOutboundMessage | SidePanelMessage | ContentScriptMessage;

function handlePillReady(tabId: number): void {
  if (tabId < 0) return;
  replyToTab(tabId, { target: "content", type: "bg:pill-visibility", visible: true });
}

export function handleOpenSidePanel(tabId: number, sender: chrome.runtime.MessageSender): void {
  const windowId = sender.tab?.windowId;
  const args = windowId !== undefined ? { tabId, windowId } : { tabId };
  chrome.sidePanel.open(args).catch((err) => {
    console.error("[bg] sidePanel.open failed", err);
  });
}

export function handleRecordingCommand(tab?: chrome.tabs.Tab): void {
  if (getBackgroundPrefs().autoOpenPanelOnHotkey) {
    const tabId = tab?.id;
    if (tabId !== undefined) {
      try {
        void chrome.sidePanel.open({ tabId });
      } catch (err) {
        console.error("[bg] sidePanel.open on hotkey failed", err);
      }
    }
  }
  handleToggleRecording();
}

type ContentHandler = (
  tabId: number,
  msg: ContentScriptMessage,
  sender: chrome.runtime.MessageSender
) => void;

const contentHandlers: { [K in ContentScriptMessage["type"]]: ContentHandler } = {
  "content:pill-ready": (tabId) => handlePillReady(tabId),
  "content:open-side-panel": (tabId, _msg, sender) => handleOpenSidePanel(tabId, sender),
};

function dispatchContentMessage(
  msg: ContentScriptMessage,
  sender: chrome.runtime.MessageSender
): void {
  const tabId = sender.tab?.id;
  if (tabId === undefined && msg.type !== "content:pill-ready") return;
  const handler = contentHandlers[msg.type];
  handler?.(tabId ?? -1, msg, sender);
}

function isContentScriptMessage(msg: InboundMessage): msg is ContentScriptMessage {
  return msg.type.startsWith("content:");
}

const inboundHandlers: {
  [K in Exclude<InboundMessage, ContentScriptMessage>["type"]]: (
    msg: Extract<InboundMessage, { type: K }>
  ) => void;
} = {
  "sp:request-start": () => handleToggleRecording(),
  "sp:request-stop": () => handleToggleRecording(),
  "sp:skills-changed": () => refreshSkillsContextMenu(),
  "offscreen:chunk-ready": forwardChunkReady,
  "offscreen:error": forwardError,
  "offscreen:status-response": (msg) => resolveOffscreenStatus(msg.recording),
};

export function routeInboundMessage(
  msg: InboundMessage,
  sender: chrome.runtime.MessageSender
): void {
  if (msg.target !== "background") return;
  if (isContentScriptMessage(msg)) {
    dispatchContentMessage(msg, sender);
    return;
  }
  const handler = inboundHandlers[msg.type as keyof typeof inboundHandlers] as (
    m: InboundMessage
  ) => void;
  handler?.(msg);
}
