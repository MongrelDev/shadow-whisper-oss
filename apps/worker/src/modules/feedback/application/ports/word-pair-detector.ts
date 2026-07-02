import { Context, Effect } from "effect";
import type { WordPairDetectionError } from "../../errors";

export interface DetectWordPairInput {
  readonly userId: string;
  readonly selectedText: string;
  readonly recentTranscriptions: ReadonlyArray<{
    readonly id: string;
    readonly finalText: string;
  }>;
}

export interface DetectedPair {
  readonly from: string;
  readonly to: string;
  readonly context: string;
}

export type DetectWordPairResult =
  | { readonly proposed: true; readonly pairs: ReadonlyArray<DetectedPair> }
  | { readonly proposed: false };

export interface WordPairDetectorService {
  readonly detect: (
    input: DetectWordPairInput
  ) => Effect.Effect<DetectWordPairResult, WordPairDetectionError>;
}

export class WordPairDetector extends Context.Service<WordPairDetector, WordPairDetectorService>()(
  "WordPairDetector"
) {}
