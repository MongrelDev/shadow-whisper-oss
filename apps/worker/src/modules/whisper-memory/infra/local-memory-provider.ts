import { Effect } from "effect";
import { WhisperMemoryService } from "../application/ports/whisper-memory-service";
import type { MemoryProviderService } from "../application/ports/memory-provider";
import { MemoryProviderError } from "../errors";

export const makeLocalMemoryProvider = (): Effect.Effect<
  MemoryProviderService,
  never,
  WhisperMemoryService
> =>
  Effect.gen(function* () {
    const svc = yield* WhisperMemoryService;
    return {
      snapshot: (input) =>
        svc
          .readSnapshot(input.category)
          .pipe(Effect.mapError((e) => new MemoryProviderError({ message: e.message }))),
    };
  });
