import { Data } from "effect";

export class DictionaryRepositoryError extends Data.TaggedError("DictionaryRepositoryError")<{
  readonly message: string;
}> {}
