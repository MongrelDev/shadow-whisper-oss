import { Context, Data, Effect } from "effect";
import type { GatewayMetadata } from "../../../../lib/gateway-metadata";

export type { GatewayMetadata };

export class SpeechToTextError extends Data.TaggedError("SpeechToTextError")<{
  readonly message: string;
  // Absent means transient (retry / fall back). Only `false` fails fast.
  readonly retryable?: boolean;
}> {}

export interface SpeechToTextResult {
  engine: string;
  text: string;
  textLength: number;
  wordCount: number;
  duration: number;
  durationMs: number;
  detectedLanguage?: string;
}

export type AudioSource =
  | {
      readonly kind: "buffer";
      readonly audio: ArrayBuffer;
      readonly contentType: string;
    }
  | {
      readonly kind: "blob";
      readonly audio: Blob;
      readonly contentType?: string;
    };

export interface SpeechToTextRequest {
  readonly source: AudioSource;
  readonly prompt?: string;
  readonly language?: string;
  // Output-formatting hint (Inverse Text Normalization). Distinct from `language`,
  // which is a recognition hint. Engines that auto-detect (e.g. Grok) use this only
  // to format numbers/currency/units; recognition stays language-agnostic. Engines
  // that bias recognition on `language` (e.g. Whisper) ignore this field.
  readonly formattingLanguage?: string;
  readonly dictionaryHints?: ReadonlyArray<string>;
  readonly keytermsPrompt?: ReadonlyArray<string>;
  readonly speakerLabels?: boolean;
  readonly temperature?: number;
  readonly filterProfanity?: boolean;
  readonly gatewayMetadata?: GatewayMetadata;
}

export interface SpeechToTextRecordingRequest {
  readonly audio: ArrayBuffer;
  readonly contentType: string;
  readonly prompt?: string;
  readonly language?: string;
  readonly formattingLanguage?: string;
  readonly dictionaryHints?: ReadonlyArray<string>;
  readonly keytermsPrompt?: ReadonlyArray<string>;
  readonly speakerLabels?: boolean;
  readonly temperature?: number;
  readonly filterProfanity?: boolean;
  readonly gatewayMetadata?: GatewayMetadata;
}

export interface SpeechToTextService {
  transcribeAudio: (
    params: SpeechToTextRequest
  ) => Effect.Effect<SpeechToTextResult, SpeechToTextError>;
  transcribeRecording: (
    params: SpeechToTextRecordingRequest
  ) => Effect.Effect<SpeechToTextResult, SpeechToTextError>;
}

export class SpeechToText extends Context.Service<SpeechToText, SpeechToTextService>()(
  "SpeechToText"
) {}
