export type GuestPhase =
  | "idle"
  | "transcribing"
  | "cleaning"
  | "applying"
  | "complete"
  | "error"
  | "cancelled";

export interface GuestSnapshot {
  phase: GuestPhase;
  rawText: string | null;
  cleanText: string | null;
  durationMs: number | null;
  wordCount: number | null;
  errorMessage: string | null;
}

export const INITIAL_SNAPSHOT: GuestSnapshot = {
  phase: "idle",
  rawText: null,
  cleanText: null,
  durationMs: null,
  wordCount: null,
  errorMessage: null,
};

export const TERMINAL_PHASES: ReadonlySet<GuestPhase> = new Set(["complete", "error", "cancelled"]);
