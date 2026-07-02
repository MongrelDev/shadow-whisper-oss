import { Layer } from "effect";
import { MemoryProvider } from "../application/ports/memory-provider";
import { makeAgentRpcMemoryProvider } from "./agent-rpc-memory-provider";

export { LearnedWordRepositoryLive } from "./learned-word-repository-live";

export const WhisperMemoryLive = (env: Env) =>
  Layer.succeed(MemoryProvider, makeAgentRpcMemoryProvider(env));
