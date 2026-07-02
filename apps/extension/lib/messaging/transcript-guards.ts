import type { TranscriptBroadcastMessage } from "~/lib/messaging/types";

export type ContentTranscriptMessage = Extract<TranscriptBroadcastMessage, { target: "content" }>;

export type SidepanelTranscriptMessage = Extract<
  TranscriptBroadcastMessage,
  { target: "sidepanel" }
>;

type RawTranscriptMessage = {
  target?: unknown;
  type?: unknown;
  text?: unknown;
  code?: unknown;
  durationMs?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFinalMessage(value: RawTranscriptMessage): boolean {
  return (
    value.type === "bg:transcript-final" &&
    typeof value.text === "string" &&
    typeof value.durationMs === "number"
  );
}

function isErrorMessage(value: RawTranscriptMessage): boolean {
  return value.type === "bg:transcript-error" && typeof value.code === "string";
}

function isTranscriptMessageForTarget<Target extends "content" | "sidepanel">(
  msg: unknown,
  target: Target
): msg is Extract<TranscriptBroadcastMessage, { target: Target }> {
  if (!isObject(msg)) return false;
  const m = msg as RawTranscriptMessage;
  if (m.target !== target) return false;
  return isFinalMessage(m) || isErrorMessage(m);
}

export function isContentTranscriptMessage(msg: unknown): msg is ContentTranscriptMessage {
  return isTranscriptMessageForTarget(msg, "content");
}

export function isSidepanelTranscriptMessage(msg: unknown): msg is SidepanelTranscriptMessage {
  return isTranscriptMessageForTarget(msg, "sidepanel");
}
