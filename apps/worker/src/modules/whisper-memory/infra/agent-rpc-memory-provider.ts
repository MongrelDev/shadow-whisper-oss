import { Effect, Layer } from "effect";
import { WhisperMemoryService } from "../application/ports/whisper-memory-service";
import { WhisperMemoryServiceLive } from "./whisper-memory-service";
import { LearnedWordRepositoryLive } from "./learned-word-repository-live";
import { DictionaryLive } from "../../dictionary/infra/live";
import { NoopObservabilityLive } from "../../../observability/observability";
import type {
  MemoryProviderInput,
  MemoryProviderService,
} from "../application/ports/memory-provider";
import type { MemoryContext } from "../domain/memory-context";
import { MemoryProviderError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeAgentRpcMemoryProvider = (env: Env): MemoryProviderService => ({
  snapshot: Effect.fnUntraced(
    function* (input: MemoryProviderInput) {
      const svc = yield* WhisperMemoryService;
      const result = yield* svc.readSnapshot(input.category);
      return {
        dictionary: result.dictionary,
        styleNotes: result.styleNotes,
      } satisfies MemoryContext;
    },
    (eff, input) =>
      eff.pipe(
        Effect.provide(
          WhisperMemoryServiceLive.pipe(
            Layer.provide(LearnedWordRepositoryLive(env, input.userId)),
            Layer.provide(DictionaryLive(env).pipe(Layer.provide(NoopObservabilityLive)))
          )
        ),
        Effect.mapError((e) => new MemoryProviderError({ message: unknownMessage(e) }))
      )
  ),
});
