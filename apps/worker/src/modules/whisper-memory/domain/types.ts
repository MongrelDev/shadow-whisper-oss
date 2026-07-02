export type LearnedWordId = string & { readonly __brand: "LearnedWordId" };

export interface LearnedWord {
  readonly id: LearnedWordId;
  readonly source: string;
  readonly replacement: string;
  readonly sourceLower: string;
  readonly context: string | null;
  readonly frequency: number;
  readonly lastUsedAt: number;
  readonly createdAt: number;
}

export interface WritingStyleSummary {
  readonly summaryJson: Record<string, unknown>;
  readonly updatedAt: number;
}
