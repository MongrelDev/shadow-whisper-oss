export interface ActionResult {
  readonly instructionText: string;
  readonly outputText: string;
  readonly instructionWordCount: number;
  readonly outputWordCount: number;
  readonly sttEngine: string;
  readonly durationMs: number;
}
