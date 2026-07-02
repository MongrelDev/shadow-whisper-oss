import { Context, Effect, Layer } from "effect";
import type { UnknownError } from "effect/Cause";
import type { SurfaceContext } from "@whisper/api";
import { SubscriptionService } from "../../billing/application/subscription-service";
import type { BillingDatabaseError, LimitExceededError } from "../../billing/errors";
import { SkillInstallationRepository } from "../../skills-catalog/application/ports/skill-installation-repository";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import { UnauthorizedError } from "../../auth/application/current-user";
import { Observability } from "../../../observability/observability";
import { SessionTokenSigner } from "./ports/session-token-signer";
import {
  TranscriptionStrategy,
  type TranscriptionInput,
  type TranscriptionOutcome,
} from "./ports/transcription-strategy";
import { SkillResolutionError, type TranscriptionFailedError, type WarmupError } from "../errors";
import type { TranscribeSyncResponse } from "../schemas";

export interface TranscribeSyncInput {
  readonly userId: string;
  readonly sessionId: string;
  readonly audio: Blob;
  readonly contentType: string;
  readonly locale: string;
  readonly skillId: string;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
}

export interface WhisperTranscriptionServiceShape {
  readonly transcribeSync: (
    input: TranscribeSyncInput
  ) => Effect.Effect<
    TranscribeSyncResponse,
    | UnauthorizedError
    | WarmupError
    | BillingDatabaseError
    | LimitExceededError
    | UnknownError
    | SkillResolutionError
    | TranscriptionFailedError
  >;
}

export class WhisperTranscriptionService extends Context.Service<
  WhisperTranscriptionService,
  WhisperTranscriptionServiceShape
>()("WhisperTranscriptionService") {}

const buildVoiceSkillsInput = (input: TranscribeSyncInput) =>
  ({
    _tag: "VoiceSkills" as const,
    userId: input.userId,
    sessionId: input.sessionId,
    audio: input.audio,
    contentType: input.contentType,
    locale: input.locale,
    timezone: input.timezone,
    language: input.language,
    platform: input.platform,
    os: input.os,
    surfaceContext: input.surfaceContext,
  }) satisfies TranscriptionInput;

const buildResponse = (outcome: TranscriptionOutcome): TranscribeSyncResponse => {
  if (outcome.result.kind !== "inline") {
    return {
      sessionId: outcome.sessionId,
      rawText: "",
      improvedText: "",
      sttEngine: "",
      durationMs: 0,
    };
  }
  return {
    sessionId: outcome.sessionId,
    rawText: outcome.result.rawText,
    improvedText: outcome.result.improvedText,
    sttEngine: outcome.result.sttEngine,
    durationMs: outcome.result.durationMs,
  };
};

export const WhisperTranscriptionServiceLive = Layer.effect(
  WhisperTranscriptionService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const sub = yield* SubscriptionService;
    const strategy = yield* TranscriptionStrategy;
    const signer = yield* SessionTokenSigner;
    const installationRepo = yield* SkillInstallationRepository;
    const skillRepo = yield* SkillRepository;

    const resolveWithForcedSkill = (input: TranscribeSyncInput) =>
      Effect.gen(function* () {
        const [installations, skillMarkdown] = yield* Effect.all(
          [
            installationRepo
              .listInstalled(input.userId)
              .pipe(Effect.catch(() => Effect.succeed([]))),
            skillRepo.load(input.skillId).pipe(Effect.catch(() => Effect.succeed(null))),
          ],
          { concurrency: 2 }
        );

        const installed = installations.find((s) => s.skillId === input.skillId);
        if (!installed) {
          return yield* new SkillResolutionError({ message: "Skill not installed" });
        }
        if (!skillMarkdown) {
          return yield* new SkillResolutionError({ message: "Skill content not found" });
        }

        return {
          _tag: "ForcedSkill" as const,
          userId: input.userId,
          sessionId: input.sessionId,
          audio: input.audio,
          contentType: input.contentType,
          locale: input.locale,
          skillId: input.skillId,
          skillMarkdown,
          timezone: input.timezone,
          language: input.language,
          platform: input.platform,
          os: input.os,
          surfaceContext: input.surfaceContext,
        } satisfies TranscriptionInput;
      });

    const resolveTranscriptionMode = (input: TranscribeSyncInput) =>
      input.skillId ? resolveWithForcedSkill(input) : Effect.succeed(buildVoiceSkillsInput(input));

    return WhisperTranscriptionService.of({
      transcribeSync: (input) =>
        Effect.gen(function* () {
          // The sessionId is the signed warmup token; reject anything not minted for
          // this user (invalid/expired/wrong-user/wrong-purpose) before doing work.
          // This also gates the unscoped warmup-metadata KV read in the strategy.
          const verification = yield* signer.verify(input.sessionId, input.userId);
          if (!verification.ok) {
            return yield* new UnauthorizedError({ reason: `session_${verification.reason}` });
          }

          const strategyInput = yield* resolveTranscriptionMode(input);

          yield* obs.setWideEvent({
            "session.operation": "transcribe_sync",
            "session.mode": strategyInput._tag,
            sessionId: input.sessionId,
            audioBytes: input.audio.size,
            locale: input.locale,
          });

          yield* sub.checkLimits(input.userId);

          const outcome = yield* strategy.run(strategyInput).pipe(
            Effect.withSpan("transcription.strategy-run", {
              attributes: {
                "session.mode": strategyInput._tag,
                "audio.bytes": input.audio.size,
                "session.id": input.sessionId,
              },
            })
          );
          return buildResponse(outcome);
        }).pipe(Effect.tapError((error) => obs.failWideEvent(error))),
    });
  })
);
