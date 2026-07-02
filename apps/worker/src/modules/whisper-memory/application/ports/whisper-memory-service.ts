import { Context, Effect } from "effect";
import type { MemoryContext } from "../../domain/memory-context";
import { WhisperMemoryError } from "../../errors";

export interface WhisperMemoryServiceService {
  readonly readSnapshot: (category: string) => Effect.Effect<MemoryContext, WhisperMemoryError>;
}

export class WhisperMemoryService extends Context.Service<
  WhisperMemoryService,
  WhisperMemoryServiceService
>()("WhisperMemoryService") {}
