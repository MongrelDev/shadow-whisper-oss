import { Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import { BackgroundTasks } from "../../../background/background-tasks";
import { SpeechToText } from "../../transcription/application/ports/speech-to-text";
import { SkillExecutor } from "../../skills-catalog/application/ports/skill-executor";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import { GroqWhisperWithCfFallbackLive } from "../../transcription/infra/live";
import { GuestAgentIdentity } from "../application/ports/guest-agent-identity";
import { GuestJobRepository } from "../application/ports/guest-job-repository";
import { GuestJobService } from "../application/ports/guest-job-service";
import { GuestSession } from "../application/ports/guest-session";
import { GuestSessionTokenSigner } from "../application/ports/guest-session-token-signer";
import { GuestServiceLive } from "../application/guest-service";
import { makeD1GuestJobRepository } from "./d1-guest-job-repository";
import { makeDirectSttGuestJobService } from "./direct-stt-guest-job-service";
import { makeHmacGuestAgentIdentity } from "./hmac-guest-agent-identity";
import { makeHttpGuestSession } from "./http-guest-session";
import { makeHmacGuestSessionTokenSigner } from "./hmac-guest-session-token-signer";
import { makeDemoSkillExecutorLayer } from "../../../durable-objects/guest-agent/infra/live";

export interface GuestLiveOptions {
  readonly speechToTextLayer?: Layer.Layer<SpeechToText>;
  readonly skillExecutorLayer?: Layer.Layer<SkillExecutor>;
}

const GuestJobServiceLive = (env: Env) =>
  Layer.effect(
    GuestJobService,
    Effect.gen(function* () {
      const obs = yield* Observability;
      const repo = yield* GuestJobRepository;
      const stt = yield* SpeechToText;
      const skillRepository = yield* SkillRepository;
      const skillExecutor = yield* SkillExecutor;
      const background = yield* BackgroundTasks;
      return makeDirectSttGuestJobService({
        env,
        obs,
        repo,
        stt,
        skillRepository,
        skillExecutor,
        background,
      });
    })
  );

export const GuestLive = (env: Env, opts?: GuestLiveOptions) => {
  const demoSkillLayer = makeDemoSkillExecutorLayer(
    env,
    opts?.skillExecutorLayer ? { skillExecutorLayer: opts.skillExecutorLayer } : undefined
  );

  const InfraLive = Layer.mergeAll(
    opts?.speechToTextLayer ?? GroqWhisperWithCfFallbackLive(env),
    demoSkillLayer,
    Layer.succeed(GuestJobRepository, makeD1GuestJobRepository(env))
  );

  const BaseLive = Layer.mergeAll(
    InfraLive,
    GuestJobServiceLive(env).pipe(Layer.provide(InfraLive)),
    Layer.succeed(GuestSession, makeHttpGuestSession(env)),
    Layer.succeed(GuestAgentIdentity, makeHmacGuestAgentIdentity(env)),
    Layer.succeed(GuestSessionTokenSigner, makeHmacGuestSessionTokenSigner(env))
  );

  return Layer.mergeAll(BaseLive, GuestServiceLive.pipe(Layer.provide(BaseLive)));
};
