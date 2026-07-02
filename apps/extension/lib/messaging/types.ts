import type { AchievementKey, MilestoneKey } from "@whisper/api";

export type MessageTarget = "offscreen" | "background" | "sidepanel" | "content";

export type RecordingState = "idle" | "recording" | "processing";

export type OffscreenInboundMessage =
  | { target: "offscreen"; type: "offscreen:start" }
  | { target: "offscreen"; type: "offscreen:stop" }
  | { target: "offscreen"; type: "offscreen:get-status" };

export type OffscreenOutboundMessage =
  | {
      target: "background";
      type: "offscreen:chunk-ready";
      bytes: number[];
      mimeType: string;
      durationMs: number;
    }
  | {
      target: "background";
      type: "offscreen:error";
      code: string;
      message: string;
    }
  | {
      target: "background";
      type: "offscreen:status-response";
      recording: boolean;
    };

export type SidePanelMessage =
  | { target: "background"; type: "sp:request-start" }
  | { target: "background"; type: "sp:request-stop" }
  | { target: "background"; type: "sp:skills-changed" };

export type SkillListItem = {
  id: string;
  slug: string;
  displayName: string;
  description: string | null;
  source: "official" | "custom";
  isInstalled: boolean;
};

export type ContentScriptMessage =
  | { target: "background"; type: "content:pill-ready" }
  | { target: "background"; type: "content:open-side-panel" };

export type PillVisibilityMessage = {
  target: "content";
  type: "bg:pill-visibility";
  visible: boolean;
};

export type StateSyncMessage = {
  target: "sidepanel" | "content";
  type: "bg:state-sync";
  state: RecordingState;
};

export type TranscribePiggybackStatsMessage = {
  todayWordCount: number;
  weekWordCount: number;
  currentStreak: number;
  wpm: number;
  totalWords: number;
  weeklyAvgWpm: number;
  isFirstWeek: boolean;
};

export type TranscriptBroadcastMessage =
  | { target: "sidepanel"; type: "bg:transcript-final"; text: string; durationMs: number }
  | { target: "content"; type: "bg:transcript-final"; text: string; durationMs: number }
  | { target: "sidepanel"; type: "bg:transcript-error"; code: string; message: string }
  | { target: "content"; type: "bg:transcript-error"; code: string; message: string };

export type TranscribeStatsUpdatedMessage =
  | {
      target: "sidepanel";
      type: "bg:transcript-stats";
      stats: TranscribePiggybackStatsMessage | null;
      unlockedAchievements?: ReadonlyArray<AchievementKey>;
      eventId?: string;
    }
  | {
      target: "content";
      type: "bg:transcript-stats";
      stats: TranscribePiggybackStatsMessage | null;
      unlockedAchievements?: ReadonlyArray<AchievementKey>;
      unlockedMilestones?: ReadonlyArray<MilestoneKey>;
      eventId?: string;
    };

export type TranscribeStatsSidepanelMessage = Extract<
  TranscribeStatsUpdatedMessage,
  { target: "sidepanel" }
>;

export type TranscribeStatsContentMessage = Extract<
  TranscribeStatsUpdatedMessage,
  { target: "content" }
>;

function isMessageWithTargetAndType(
  msg: unknown,
  target: MessageTarget,
  type: string
): msg is { target: MessageTarget; type: string } {
  if (typeof msg !== "object" || msg === null) return false;
  const m = msg as { target?: unknown; type?: unknown };
  return m.target === target && m.type === type;
}

export function isTranscribeStatsSidepanelMessage(
  msg: unknown
): msg is TranscribeStatsSidepanelMessage {
  return isMessageWithTargetAndType(msg, "sidepanel", "bg:transcript-stats");
}

export function isTranscribeStatsContentMessage(
  msg: unknown
): msg is TranscribeStatsContentMessage {
  return isMessageWithTargetAndType(msg, "content", "bg:transcript-stats");
}

export type BackgroundMessage =
  | StateSyncMessage
  | PillVisibilityMessage
  | TranscriptBroadcastMessage
  | TranscribeStatsUpdatedMessage;
