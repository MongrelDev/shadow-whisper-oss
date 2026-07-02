import { create } from "zustand";
import type { Transcription } from "@/lib/db";
import type { DiffPart } from "../lib/diff-helpers";
import { computeWordDiffParts } from "../lib/diff-helpers";

const FEEDBACK_DURATION = 4000;
const LIMIT_TRIGGER_DURATION = 3000;

export interface FeedbackAction {
  label: string;
  onClick: () => void;
}

export type FeedbackKind =
  | { kind: "no-text-field" }
  | { kind: "transcription-failed"; onRetry?: () => void }
  | { kind: "generic"; reason: string; hint?: string; action?: FeedbackAction };

export type ActiveNudge = "skill-discovery" | "cleanup-diff" | "operational" | null;

export interface DiffPanelData {
  rawText: string;
  formattedText: string;
  diffParts: DiffPart[];
}

export interface CleanupDiffNudgeData {
  rawText: string;
  formattedText: string;
}

interface PillState {
  feedback: FeedbackKind | null;
  isLimitReached: boolean;
  limitTriggered: boolean;
  lastCompleted: Transcription | null;
  diffPanelOpen: boolean;
  diffPanelData: DiffPanelData | null;
  activeNudge: ActiveNudge;
  cleanupDiffNudgeData: CleanupDiffNudgeData | null;
}

interface PillActions {
  showFeedback: (feedback: FeedbackKind) => void;
  clearFeedback: () => void;
  triggerLimit: () => void;
  dismissLimitTrigger: () => void;
  clearLimit: () => void;
  setLastCompleted: (transcription: Transcription) => void;
  openDiffPanel: (rawText: string, formattedText: string) => void;
  closeDiffPanel: () => void;
  setActiveNudge: (nudge: ActiveNudge) => void;
  clearActiveNudge: () => void;
  setCleanupDiffNudge: (rawText: string, formattedText: string) => void;
}

export type PillStore = PillState & PillActions;

let limitTimer: ReturnType<typeof setTimeout> | null = null;
let feedbackTimer: ReturnType<typeof setTimeout> | null = null;

export const usePillStore = create<PillStore>((set) => ({
  feedback: null,
  isLimitReached: false,
  limitTriggered: false,
  lastCompleted: null,
  diffPanelOpen: false,
  diffPanelData: null,
  activeNudge: null,
  cleanupDiffNudgeData: null,

  showFeedback: (feedback) => {
    if (feedbackTimer != null) clearTimeout(feedbackTimer);
    set({ feedback });
    // Feedback with an action stays until the user dismisses it.
    if (feedback.kind === "transcription-failed") return;
    if (feedback.kind === "generic" && feedback.action) return;
    feedbackTimer = setTimeout(() => set({ feedback: null }), FEEDBACK_DURATION);
  },

  clearFeedback: () => {
    if (feedbackTimer != null) clearTimeout(feedbackTimer);
    set({ feedback: null });
  },

  triggerLimit: () => {
    if (limitTimer != null) clearTimeout(limitTimer);
    set({ isLimitReached: true, limitTriggered: true });
    limitTimer = setTimeout(() => set({ limitTriggered: false }), LIMIT_TRIGGER_DURATION);
  },

  dismissLimitTrigger: () => {
    if (limitTimer != null) clearTimeout(limitTimer);
    set({ limitTriggered: false });
  },

  clearLimit: () => set({ isLimitReached: false }),

  setLastCompleted: (transcription) => set({ lastCompleted: transcription }),

  openDiffPanel: (rawText, formattedText) => {
    const diffParts = computeWordDiffParts(rawText, formattedText);
    set({ diffPanelOpen: true, diffPanelData: { rawText, formattedText, diffParts } });
  },

  closeDiffPanel: () => set({ diffPanelOpen: false, diffPanelData: null }),

  setActiveNudge: (nudge) => set({ activeNudge: nudge }),

  clearActiveNudge: () => set({ activeNudge: null }),

  setCleanupDiffNudge: (rawText, formattedText) =>
    set({ cleanupDiffNudgeData: { rawText, formattedText }, activeNudge: "cleanup-diff" }),
}));
