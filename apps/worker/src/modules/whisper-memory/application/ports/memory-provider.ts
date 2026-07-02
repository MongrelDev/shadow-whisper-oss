import { Context, Effect } from "effect";
import type { MemoryProviderError } from "../../errors";
import type { MemoryContext } from "../../domain/memory-context";

export interface MemoryProviderInput {
  readonly userId: string;
  readonly category: string;
}

export interface MemoryProviderService {
  readonly snapshot: (
    input: MemoryProviderInput
  ) => Effect.Effect<MemoryContext, MemoryProviderError>;
}

export class MemoryProvider extends Context.Service<MemoryProvider, MemoryProviderService>()(
  "MemoryProvider"
) {}
