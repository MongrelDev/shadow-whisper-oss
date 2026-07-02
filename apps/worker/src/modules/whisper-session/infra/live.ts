import { Layer } from "effect";
import { SessionTokenSigner } from "../application/ports/session-token-signer";
import { WhisperAgentSession } from "../application/ports/whisper-agent-session";
import { TranscriptionStrategy } from "../application/ports/transcription-strategy";
import { SessionRewardsSource } from "../application/ports/session-rewards-source";
import { WhisperSessionServiceLive } from "../application/whisper-session-service";
import { WhisperTranscriptionServiceLive } from "../application/whisper-transcription-service";
import { WhisperRewardsServiceLive } from "../application/whisper-rewards-service";
import { makeHmacSessionTokenSigner } from "./hmac-session-token-signer";
import { makeDOWhisperAgentSession } from "./do-whisper-agent-session";
import { makeAgentBackedTranscriptionStrategy } from "./agent-backed-transcription-strategy";
import { makeDOSessionRewardsSource } from "./do-session-rewards-source";

// STT, TextImprover, dictionary, and usage now live inside the WhisperAgent;
// the Worker stays the HTTP/security edge and forwards to the agent over DO RPC.
const TranscriptionStrategyLive = (env: Env) =>
  Layer.succeed(TranscriptionStrategy, makeAgentBackedTranscriptionStrategy(env));

export const WhisperSessionLive = (env: Env) => {
  const InfraLive = Layer.mergeAll(
    Layer.succeed(SessionTokenSigner, makeHmacSessionTokenSigner(env)),
    Layer.succeed(WhisperAgentSession, makeDOWhisperAgentSession(env)),
    Layer.succeed(SessionRewardsSource, makeDOSessionRewardsSource(env))
  );

  const strategyLive = TranscriptionStrategyLive(env);
  const allInfra = Layer.mergeAll(InfraLive, strategyLive);

  return Layer.mergeAll(
    allInfra,
    WhisperSessionServiceLive.pipe(Layer.provide(allInfra)),
    WhisperTranscriptionServiceLive.pipe(Layer.provide(allInfra)),
    WhisperRewardsServiceLive.pipe(Layer.provide(allInfra))
  );
};
