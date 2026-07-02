import { Context, Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import { TranscriptionFailedError } from "../../errors";

interface TranscriptionBase {
  readonly userId: string;
  readonly sessionId: string;
  readonly audio: Blob;
  readonly contentType: string;
  readonly locale: string;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
}

export interface TranscriptionWithVoiceSkills extends TranscriptionBase {
  readonly _tag: "VoiceSkills";
}

export interface TranscriptionWithForcedSkill extends TranscriptionBase {
  readonly _tag: "ForcedSkill";
  readonly skillId: string;
  readonly skillMarkdown: string;
}

export type TranscriptionInput = TranscriptionWithVoiceSkills | TranscriptionWithForcedSkill;

export type TranscriptionResult =
  | {
      readonly kind: "inline";
      readonly rawText: string;
      readonly improvedText: string;
      readonly sttEngine: string;
      readonly durationMs: number;
    }
  | { readonly kind: "deferred" };

export interface TranscriptionOutcome {
  readonly sessionId: string;
  readonly workflowInstanceId: string | null;
  readonly result: TranscriptionResult;
}

export type TranscriptionStrategyError = TranscriptionFailedError;

export interface TranscriptionStrategyService {
  readonly run: (
    input: TranscriptionInput
  ) => Effect.Effect<TranscriptionOutcome, TranscriptionStrategyError>;
}

export class TranscriptionStrategy extends Context.Service<
  TranscriptionStrategy,
  TranscriptionStrategyService
>()("TranscriptionStrategy") {}
