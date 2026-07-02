import { Context, Effect } from "effect";
import type { Dictionary, DictionaryWord, Snippet } from "../../domain/dictionary";
import type { DictionaryRepositoryError } from "../../errors";

export interface DictionaryRepositoryService {
  getDictionary: (userId: string) => Effect.Effect<Dictionary, DictionaryRepositoryError>;
  addWord: (
    userId: string,
    word: string
  ) => Effect.Effect<DictionaryWord, DictionaryRepositoryError>;
  removeWord: (userId: string, id: number) => Effect.Effect<void, DictionaryRepositoryError>;
  addSnippet: (
    userId: string,
    triggerPhrase: string,
    expandedText: string
  ) => Effect.Effect<Snippet, DictionaryRepositoryError>;
  removeSnippet: (userId: string, id: number) => Effect.Effect<void, DictionaryRepositoryError>;
}

export class DictionaryRepository extends Context.Service<
  DictionaryRepository,
  DictionaryRepositoryService
>()("DictionaryRepository") {}
