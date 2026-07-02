import { Context, Effect, Layer } from "effect";
import type { Dictionary, DictionaryWord, Snippet } from "../domain/dictionary";
import type { DictionaryRepositoryError } from "../errors";
import { DictionaryRepository } from "./ports/dictionary-repository";
import { Observability, captureErrorWith } from "../../../observability/observability";

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
    const captureError = captureErrorWith(obs);

    return DictionaryService.of({
      getDictionary: Effect.fnUntraced(function* (userId: string) {
        yield* obs.setWideEvent({ "dictionary.operation": "get" });
        const result = yield* dictionary.getDictionary(userId);
        yield* obs.setWideEvent({
          wordCount: result.words.length,
          snippetCount: result.snippets.length,
        });
        return result;
      }, captureError),

      addWord: Effect.fnUntraced(function* (userId: string, word: string) {
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
      }, captureError),

      removeWord: Effect.fnUntraced(function* (userId: string, id: number) {
        yield* obs.setWideEvent({
          "dictionary.operation": "remove_word",
          entityId: id,
        });
        yield* dictionary.removeWord(userId, id);
      }, captureError),

      addSnippet: Effect.fnUntraced(function* (
        userId: string,
        triggerPhrase: string,
        expandedText: string
      ) {
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
      }, captureError),

      removeSnippet: Effect.fnUntraced(function* (userId: string, id: number) {
        yield* obs.setWideEvent({
          "dictionary.operation": "remove_snippet",
          entityId: id,
        });
        yield* dictionary.removeSnippet(userId, id);
      }, captureError),
    });
  })
);
