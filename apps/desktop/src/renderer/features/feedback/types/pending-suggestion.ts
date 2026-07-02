import type { PendingSuggestionResponse } from "@whisper/api";

export type PendingSuggestion = PendingSuggestionResponse;

export interface UnmatchedFeedbackEntry {
  feedbackId: string;
  at: number;
}

export interface FailedFeedbackEntry {
  feedbackId: string;
  at: number;
  reason: string;
}
