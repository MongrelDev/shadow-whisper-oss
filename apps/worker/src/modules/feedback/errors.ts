import { Data } from "effect";

export class FeedbackPersistError extends Data.TaggedError("FeedbackPersistError")<{
  readonly message: string;
}> {}

export class WordPairDetectionError extends Data.TaggedError("WordPairDetectionError")<{
  readonly message: string;
}> {}

export class AutoEditValidatorError extends Data.TaggedError("AutoEditValidatorError")<{
  readonly message: string;
}> {}
