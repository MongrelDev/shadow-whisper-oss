import { Context, Effect } from "effect";
import { GuestJobRepositoryError } from "../../errors";
import { SpeechToTextError } from "../../../transcription/application/ports/speech-to-text";

export interface StartGuestTranscribeInput {
  readonly agentId: string;
  readonly audio: Blob;
  readonly locale: string;
}

export interface StartGuestSkillInput {
  readonly agentId: string;
  readonly skillId: string;
  readonly locale: string;
  readonly inputText: string;
}

export interface StartGuestTranscribeResult {
  readonly rawText: string;
  readonly cleanText: string;
  readonly durationMs: number;
  readonly wordCount: number;
}

export interface StartGuestSkillResult {
  readonly cleanText: string;
  readonly wordCount: number;
}

export type StartGuestTranscribeError = GuestJobRepositoryError | SpeechToTextError;

export type StartGuestSkillError = GuestJobRepositoryError;

export interface GuestJobServiceShape {
  readonly startTranscribe: (
    input: StartGuestTranscribeInput
  ) => Effect.Effect<StartGuestTranscribeResult, StartGuestTranscribeError>;
  readonly startSkill: (
    input: StartGuestSkillInput
  ) => Effect.Effect<StartGuestSkillResult, StartGuestSkillError>;
}

export class GuestJobService extends Context.Service<GuestJobService, GuestJobServiceShape>()(
  "GuestJobService"
) {}
