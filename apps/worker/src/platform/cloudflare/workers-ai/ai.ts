import { Data, Effect } from "effect";
import type { GatewayMetadata } from "../../../lib/gateway-metadata";

export type { GatewayMetadata };

export class TranscribeError extends Data.TaggedError("TranscribeError")<{
  readonly message: string;
  // Absent means transient (retry / fall back). Only `false` fails fast — set it
  // for auth/client errors that an alternate engine won't fix.
  readonly retryable?: boolean;
}> {}

export class ChatError extends Data.TaggedError("ChatError")<{
  readonly message: string;
}> {}

export interface TranscribeResult {
  engine: string;
  text: string;
  duration: number;
  detectedLanguage?: string;
  durationAfterVad?: number;
}

export interface TranscribeService {
  transcribe: (params: {
    audio: ArrayBuffer;
    contentType: string;
    prompt?: string;
    language?: string;
    formattingLanguage?: string;
    dictionaryHints?: ReadonlyArray<string>;
    keytermsPrompt?: ReadonlyArray<string>;
    speakerLabels?: boolean;
    temperature?: number;
    filterProfanity?: boolean;
    gatewayMetadata?: GatewayMetadata;
  }) => Effect.Effect<TranscribeResult, TranscribeError>;
}

export interface ChatService {
  chat: (params: {
    system: string;
    message: string;
    gatewayMetadata?: GatewayMetadata;
  }) => Effect.Effect<string, ChatError>;
  transformText: (params: {
    system: string;
    message: string;
    gatewayMetadata?: GatewayMetadata;
  }) => Effect.Effect<string, ChatError>;
}
