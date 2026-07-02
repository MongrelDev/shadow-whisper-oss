import { Data } from "effect";

export class WarmupError extends Data.TaggedError("WarmupError")<{
  readonly message: string;
}> {}

export class TranscriptionFailedError extends Data.TaggedError("TranscriptionFailedError")<{
  readonly message: string;
}> {}

export class SkillResolutionError extends Data.TaggedError("SkillResolutionError")<{
  readonly message: string;
}> {}
