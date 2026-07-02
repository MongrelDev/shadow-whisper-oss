import { Context, Effect } from "effect";
import type { DictionaryRepoError } from "../../errors";
import type { LearnedWord } from "../../domain/types";

export interface UpsertLearnedWordInput {
  readonly source: string;
  readonly replacement: string;
  readonly context: string | null;
  readonly now: number;
}

export interface LearnedWordRepositoryService {
  readonly upsertBySource: (
    input: UpsertLearnedWordInput
  ) => Effect.Effect<LearnedWord, DictionaryRepoError>;
  readonly findBySource: (source: string) => Effect.Effect<LearnedWord | null, DictionaryRepoError>;
  readonly listAll: () => Effect.Effect<readonly LearnedWord[], DictionaryRepoError>;
  readonly listTopByFrequency: (
    limit: number
  ) => Effect.Effect<readonly LearnedWord[], DictionaryRepoError>;
}

export class LearnedWordRepository extends Context.Service<
  LearnedWordRepository,
  LearnedWordRepositoryService
>()("LearnedWordRepository") {}
