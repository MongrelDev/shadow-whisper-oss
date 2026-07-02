import { Context, Data, Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import type { Surface } from "../../domain/session-context";

export class TextImproverError extends Data.TaggedError("TextImproverError")<{
  readonly message: string;
  // Absent means transient (retry / fall back). Only `false` fails fast.
  readonly retryable?: boolean;
}> {}

interface BaseParams {
  readonly userId: string;
  readonly rawText: string;
  readonly surface: Surface | null;
  readonly bundleId: string | null;
  readonly appHost: string | null;
  readonly surfaceContext: SurfaceContext | null;
  readonly detectedLanguage: string | null;
  readonly timezone: string | null;
}

export interface VoiceSkillsParams extends BaseParams {
  readonly mode: "voice-skills";
}

export interface ForcedSkillParams extends BaseParams {
  readonly mode: "forced-skill";
  readonly skillMarkdown: string;
}

export type TextImproverParams = VoiceSkillsParams | ForcedSkillParams;

export interface TextImproverService {
  readonly improve: (params: TextImproverParams) => Effect.Effect<string, TextImproverError>;
}

export class TextImprover extends Context.Service<TextImprover, TextImproverService>()(
  "TextImprover"
) {}
