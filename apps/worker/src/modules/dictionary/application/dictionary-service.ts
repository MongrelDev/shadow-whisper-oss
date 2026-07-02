import { Context, Effect, Layer } from "effect";
import type { Dictionary, DictionaryWord, Snippet } from "../domain/dictionary";
import type { DictionaryRepositoryError } from "../errors";
import { DictionaryRepository } from "./ports/dictionary-repository";
import { Observability } from "../../../observability/observability";

export interface DictionaryServiceShape {
  readonly getDictionary: (userId: string) => Effect.Effect<Dictionary, DictionaryRepositoryError>;
  readonly addWord: (
    userId: string,
    word: string
  ) => Effect.Effect<DictionaryWord, DictionaryRepositoryError>;
  readonly removeWord: (
    userId: string,
    id: number
  ) => Effect.Effect<void, DictionaryRepositoryError>;
  readonly addSnippet: (
    userId: string,
    triggerPhrase: string,
    expandedText: string
  ) => Effect.Effect<Snippet, DictionaryRepositoryError>;
  readonly removeSnippet: (
    userId: string,
    id: number
  ) => Effect.Effect<void, DictionaryRepositoryError>;
}

export class DictionaryService extends Context.Service<DictionaryService, DictionaryServiceShape>()(
  "DictionaryService"
) {}

export const DictionaryServiceLive = Layer.effect(
  DictionaryService,
  Effect.gen(function* () {
    const dictionary = yield* DictionaryRepository;
    const obs = yield* Observability;
    const captureError = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    return DictionaryService.of({
      getDictionary: (userId) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({ "dictionary.operation": "get" });
          const result = yield* dictionary.getDictionary(userId);
          yield* obs.setWideEvent({
            wordCount: result.words.length,
            snippetCount: result.snippets.length,
          });
          return result;
        }).pipe(captureError),

      addWord: (userId, word) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({
            "dictionary.operation": "add_word",
            wordLength: word.length,
          });
          const result = yield* dictionary.addWord(userId, word);
          yield* obs.setWideEvent({
            entityId: result.id,
            normalizedWordLength: result.word.length,
          });
          return result;
        }).pipe(captureError),

      removeWord: (userId, id) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({
            "dictionary.operation": "remove_word",
            entityId: id,
          });
          yield* dictionary.removeWord(userId, id);
        }).pipe(captureError),

      addSnippet: (userId, triggerPhrase, expandedText) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({
            "dictionary.operation": "add_snippet",
            triggerLength: triggerPhrase.length,
            snippetLength: expandedText.length,
          });
          const result = yield* dictionary.addSnippet(userId, triggerPhrase, expandedText);
          yield* obs.setWideEvent({
            entityId: result.id,
            persistedTriggerLength: result.triggerPhrase.length,
            persistedSnippetLength: result.expandedText.length,
          });
          return result;
        }).pipe(captureError),

      removeSnippet: (userId, id) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({
            "dictionary.operation": "remove_snippet",
            entityId: id,
          });
          yield* dictionary.removeSnippet(userId, id);
        }).pipe(captureError),
    });
  })
);
