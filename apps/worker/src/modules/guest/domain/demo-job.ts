export type DemoJobKind = "transcribe" | "skill";

export type DemoJobPhase =
  | "queued"
  | "transcribing"
  | "transcribed"
  | "cleaning"
  | "applying"
  | "complete"
  | "error"
  | "cancelled";

export const TERMINAL_PHASES: ReadonlySet<DemoJobPhase> = new Set([
  "complete",
  "error",
  "cancelled",
]);

export interface DemoJob {
  readonly workflowId: string;
  readonly kind: DemoJobKind;
  readonly phase: DemoJobPhase;
  readonly surfaceId: string | null;
  readonly skillId: string | null;
  readonly rawText: string | null;
  readonly cleanText: string | null;
  readonly durationMs: number | null;
  readonly audioBytes: number | null;
  readonly wordCount: number | null;
  readonly locale: string | null;
  readonly errorMessage: string | null;
  readonly cancelledAt: number | null;
  readonly phaseUpdatedAt: number;
}

export interface InsertDemoJobInput {
  readonly workflowId: string;
  readonly kind: DemoJobKind;
  readonly surfaceId: string | null;
  readonly skillId: string | null;
  readonly rawText: string | null;
  readonly audioBytes: number | null;
  readonly wordCount: number | null;
  readonly locale: string;
  readonly ipHash: string;
}
