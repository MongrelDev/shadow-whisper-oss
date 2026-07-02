import { Data } from "effect";

export class WhisperMemoryError extends Data.TaggedError("WhisperMemoryError")<{
  readonly message: string;
}> {}

export class DictionaryRepoError extends Data.TaggedError("DictionaryRepoError")<{
  readonly message: string;
}> {}

export class WritingStyleRepoError extends Data.TaggedError("WritingStyleRepoError")<{
  readonly message: string;
}> {}

export class MemoryProviderError extends Data.TaggedError("MemoryProviderError")<{
  readonly message: string;
}> {}
