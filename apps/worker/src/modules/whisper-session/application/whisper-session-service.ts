import { Context, Effect, Layer } from "effect";
import { LimitExceededError } from "../../billing/errors";
import { SubscriptionService } from "../../billing/application/subscription-service";
import { Observability } from "../../../observability/observability";
import { SessionTokenSigner, AUTHENTICATED_WARMUP_PURPOSE } from "./ports/session-token-signer";
import { WhisperAgentSession } from "./ports/whisper-agent-session";
import { EMPTY_WARMUP_METADATA, type WarmupMetadata } from "../domain/warmup-metadata";
import { WarmupError } from "../errors";

export interface WarmupSessionInput {
  readonly userId: string;
  readonly warmupMetadata?: WarmupMetadata | undefined;
}

export interface WarmupSessionResult {
  readonly sessionId: string;
}

export interface WhisperSessionServiceShape {
  readonly warmupSession: (
    input: WarmupSessionInput
  ) => Effect.Effect<WarmupSessionResult, LimitExceededError | WarmupError>;
}

export class WhisperSessionService extends Context.Service<
  WhisperSessionService,
  WhisperSessionServiceShape
>()("WhisperSessionService") {}

const SESSION_TOKEN_TTL_SECONDS = 600;

export const WhisperSessionServiceLive = Layer.effect(
  WhisperSessionService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const sub = yield* SubscriptionService;
    const signer = yield* SessionTokenSigner;
    const agentSession = yield* WhisperAgentSession;

    const captureError = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    return WhisperSessionService.of({
      warmupSession: Effect.fnUntraced(function* (input) {
        yield* obs.setWideEvent({
          "session.operation": "warmup",
          userId: input.userId,
          hasMeta: input.warmupMetadata !== undefined,
        });

        const limitStatus = yield* sub.checkLimits(input.userId).pipe(
          Effect.tapError(() => obs.setWideEvent({ quotaCheckStep: "warmup" })),
          Effect.catchTags({
            BillingDatabaseError: (e) =>
              new WarmupError({ message: `billing_error: ${e.message}` }),
            UnknownError: (e) =>
              new WarmupError({ message: `billing_unknown: ${String(e.cause)}` }),
          })
        );

        yield* obs.setWideEvent({
          quotaUsedWords: limitStatus.usage.totalWords,
          quotaLimit: limitStatus.limit,
        });

        const exp = Math.floor(Date.now() / 1000) + SESSION_TOKEN_TTL_SECONDS;
        const sessionId = yield* signer.sign({
          uid: input.userId,
          purpose: AUTHENTICATED_WARMUP_PURPOSE,
          exp,
        });

        const metaWithSessionId: WarmupMetadata = input.warmupMetadata
          ? { ...input.warmupMetadata, sessionId }
          : { ...EMPTY_WARMUP_METADATA, sessionId, subjectId: input.userId };

        yield* agentSession.registerSession({
          userId: input.userId,
          sessionId,
          metadata: metaWithSessionId,
          startedAt: Date.now(),
        });

        yield* obs.setWideEvent({ warmupCompleted: true });

        return { sessionId } satisfies WarmupSessionResult;
      }, captureError),
    });
  })
);
