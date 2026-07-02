import { Context, Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import { GuestSession } from "./ports/guest-session";
import { GuestAgentIdentity } from "./ports/guest-agent-identity";
import { GuestJobService } from "./ports/guest-job-service";
import { GuestSessionTokenSigner } from "./ports/guest-session-token-signer";
import { GuestSessionAuthError } from "../errors";
import type {
  StartGuestTranscribeResult,
  StartGuestTranscribeError,
  StartGuestSkillResult,
  StartGuestSkillError,
} from "./ports/guest-job-service";
import type { BootError } from "../errors";

export interface WarmupGuestInput {
  readonly cookieHeader: string | null;
}

export interface WarmupGuestResult {
  readonly sessionId: string;
  readonly setCookieHeader: string | null;
}

export interface StartTranscribeJobInput {
  readonly cookieHeader: string | null;
  readonly sessionId: string;
  readonly audio: Blob;
  readonly locale: string;
}

export interface StartSkillJobInput {
  readonly cookieHeader: string | null;
  readonly sessionId: string;
  readonly skillId: string;
  readonly locale: string;
  readonly inputText: string;
}

export interface GuestServiceShape {
  readonly warmupGuest: (input: WarmupGuestInput) => Effect.Effect<WarmupGuestResult, BootError>;
  readonly startTranscribeJob: (
    input: StartTranscribeJobInput
  ) => Effect.Effect<
    StartGuestTranscribeResult,
    GuestSessionAuthError | BootError | StartGuestTranscribeError
  >;
  readonly startSkillJob: (
    input: StartSkillJobInput
  ) => Effect.Effect<
    StartGuestSkillResult,
    GuestSessionAuthError | BootError | StartGuestSkillError
  >;
}

export class GuestService extends Context.Service<GuestService, GuestServiceShape>()(
  "GuestService"
) {}

export const GuestServiceLive = Layer.effect(
  GuestService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const session = yield* GuestSession;
    const identity = yield* GuestAgentIdentity;
    const jobs = yield* GuestJobService;
    const tokenSigner = yield* GuestSessionTokenSigner;

    const captureError = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    const verifyGuestSession = Effect.fnUntraced(function* (
      cookieHeader: string | null,
      sessionId: string
    ) {
      const { cookieValue, isNew } = yield* session.readOrMint(cookieHeader);
      if (isNew) {
        return yield* new GuestSessionAuthError({ reason: "missing_token" });
      }
      const result = yield* tokenSigner.verify(sessionId, cookieValue);
      if (!result.ok) {
        return yield* new GuestSessionAuthError({ reason: result.reason });
      }
      const agentId = yield* identity.derive(cookieValue);
      return agentId;
    });

    return GuestService.of({
      warmupGuest: Effect.fnUntraced(function* ({ cookieHeader }: WarmupGuestInput) {
        const { cookieValue, isNew } = yield* session.readOrMint(cookieHeader);
        const sessionId = yield* tokenSigner.sign(cookieValue);
        const setCookieHeader = isNew ? session.serializeCookie(cookieValue) : null;
        return { sessionId, setCookieHeader };
      }),

      startTranscribeJob: Effect.fnUntraced(
        function* (input: StartTranscribeJobInput) {
          const agentId = yield* verifyGuestSession(input.cookieHeader, input.sessionId);
          return yield* jobs.startTranscribe({ agentId, audio: input.audio, locale: input.locale });
        },
        (eff, input) =>
          eff.pipe(
            captureError,
            Effect.withSpan("guest.transcribe-job", {
              attributes: { "session.locale": input.locale },
            })
          )
      ),

      startSkillJob: Effect.fnUntraced(
        function* (input: StartSkillJobInput) {
          const agentId = yield* verifyGuestSession(input.cookieHeader, input.sessionId);
          return yield* jobs.startSkill({
            agentId,
            skillId: input.skillId,
            locale: input.locale,
            inputText: input.inputText,
          });
        },
        (eff, input) =>
          eff.pipe(
            captureError,
            Effect.withSpan("guest.skill-job", {
              attributes: { "skill.id": input.skillId, "input.length": input.inputText.length },
            })
          )
      ),
    });
  })
);
