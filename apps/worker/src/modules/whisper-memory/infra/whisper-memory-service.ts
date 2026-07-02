import { Effect, Layer } from "effect";
import { WhisperMemoryService } from "../application/ports/whisper-memory-service";
import { LearnedWordRepository } from "../application/ports/learned-word-repository";
import type { MemoryContext, MemoryDictionaryEntry } from "../domain/memory-context";
import { EMPTY_MEMORY_CONTEXT } from "../domain/memory-context";
import { WhisperMemoryError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const DICTIONARY_SNAPSHOT_LIMIT = 50;

export const WhisperMemoryServiceLive = Layer.effect(
  WhisperMemoryService,
  Effect.gen(function* () {
    const learnedWordRepo = yield* LearnedWordRepository;

    return {
      readSnapshot: () =>
        Effect.gen(function* () {
          const dictionary = yield* learnedWordRepo.listTopByFrequency(DICTIONARY_SNAPSHOT_LIMIT);

          const dictionaryOut: ReadonlyArray<MemoryDictionaryEntry> = dictionary.map((d) => ({
            source: d.source,
            replacement: d.replacement,
          }));

          return {
            dictionary: dictionaryOut,
            styleNotes: [],
          } satisfies MemoryContext;
        }).pipe(
          Effect.mapError((e) => new WhisperMemoryError({ message: unknownMessage(e) })),
          Effect.catch(() => Effect.succeed(EMPTY_MEMORY_CONTEXT))
        ),
    };
  })
);
