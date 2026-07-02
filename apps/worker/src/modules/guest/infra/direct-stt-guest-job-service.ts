import { Duration, Effect, Layer, Schedule } from "effect";
import type { ObservabilityService } from "../../../observability/observability";
import type { BackgroundTasksService } from "../../../background/background-tasks";
import type { SpeechToTextService } from "../../transcription/application/ports/speech-to-text";
import { SpeechToTextError } from "../../transcription/application/ports/speech-to-text";
import type { SkillRepositoryService } from "../../skills/application/ports/skill-repository";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import type { SkillExecutorService } from "../../skills-catalog/application/ports/skill-executor";
import { SkillExecutor } from "../../skills-catalog/application/ports/skill-executor";
import { SkillExecutionError } from "../../skills-catalog/errors";
import type { GuestJobRepositoryService } from "../application/ports/guest-job-repository";
import type {
  GuestJobServiceShape,
  StartGuestSkillInput,
  StartGuestTranscribeInput,
} from "../application/ports/guest-job-service";
import { DEMO_CLEANUP_KEYS } from "../domain/allowed-skills";
import { countWords } from "../../../lib/count-words";
import { runDemoSkill } from "../../../durable-objects/guest-agent/run-demo-skill";

const retryOnce = Schedule.recurs(1);
const OPERATION_BUDGET = "30 seconds";

export interface GuestJobServiceDeps {
  readonly env: Env;
  readonly obs: ObservabilityService;
  readonly repo: GuestJobRepositoryService;
  readonly stt: SpeechToTextService;
  readonly skillRepository: SkillRepositoryService;
  readonly skillExecutor: SkillExecutorService;
  readonly background: BackgroundTasksService;
}

const makeDemoSkillLayer = (deps: GuestJobServiceDeps) =>
  Layer.succeed(SkillRepository, deps.skillRepository).pipe(
    Layer.provideMerge(Layer.succeed(SkillExecutor, deps.skillExecutor))
  );

export const makeDirectSttGuestJobService = (deps: GuestJobServiceDeps): GuestJobServiceShape => ({
  startTranscribe: Effect.fnUntraced(function* (input: StartGuestTranscribeInput) {
    const { obs, repo, stt, background } = deps;
    const { agentId, audio, locale } = input;
    const jobId = crypto.randomUUID();
    const gatewayMetadata = { jobId, flow: "guest.transcribe", agentId } as const;

    yield* obs.setWideEvent({
      "guest.operation": "transcribe_start_direct_stt",
      jobId,
      agentId,
      locale,
      audioBytes: audio.size,
    });

    yield* repo
      .insert({
        workflowId: jobId,
        kind: "transcribe",
        surfaceId: null,
        skillId: null,
        rawText: null,
        audioBytes: audio.size,
        wordCount: null,
        locale,
        ipHash: agentId,
      })
      .pipe(Effect.withSpan("guest.d1-insert"));

    yield* obs.setWideEvent({ "stt.start": true });

    const sttAttempts = { count: 0 };
    const [sttWallDuration, sttResult] = yield* stt
      .transcribeAudio({
        source: { kind: "blob", audio },
        ...(locale && locale !== "auto" ? { language: locale } : {}),
        gatewayMetadata,
      })
      .pipe(
        Effect.tap(() =>
          Effect.sync(() => {
            sttAttempts.count += 1;
          })
        ),
        Effect.tapError((error) =>
          Effect.sync(() => {
            sttAttempts.count += 1;
          }).pipe(
            Effect.andThen(
              obs.setWideEvent({
                "stt.attempt.failed": sttAttempts.count,
                "stt.lastError": error.message,
              })
            )
          )
        ),
        // Per-engine retry now lives in the STT fallback layer (Groq×2 → CF×2);
        // retrying here would re-run the whole fallback pair and amplify calls.
        Effect.timeoutOrElse({
          duration: OPERATION_BUDGET,
          orElse: () =>
            Effect.fail(
              new SpeechToTextError({
                message: `STT total budget exceeded (${OPERATION_BUDGET})`,
              })
            ),
        }),
        Effect.tapError((error) =>
          obs.setWideEvent({
            "stt.budgetExceeded": error.message.startsWith("STT total budget"),
            "stt.finalError": error.message,
          })
        ),
        Effect.withSpan("guest.stt", {
          attributes: { "audio.bytes": audio.size, "session.locale": locale },
        }),
        Effect.timed
      );

    const sttWallMs = Duration.toMillis(sttWallDuration);

    yield* obs.setWideEvent({
      "stt.end": true,
      "stt.attempts": sttAttempts.count,
      directSttCompleted: true,
      rawTextLength: sttResult.textLength,
      wordCount: sttResult.wordCount,
      audioDurationMs: sttResult.durationMs,
      sttWallMs,
      sttEngine: sttResult.engine,
    });

    const llmAttempts = { count: 0 };
    yield* obs.setWideEvent({ "llm.start": sttResult.text.trim() ? true : false });
    const [llmWallDuration, cleanText] = yield* (
      sttResult.text.trim()
        ? runDemoSkill({
            rawText: sttResult.text,
            skillKeys: DEMO_CLEANUP_KEYS,
            gatewayMetadata: { ...gatewayMetadata, stage: "llm" },
          }).pipe(
            Effect.tap(() =>
              Effect.sync(() => {
                llmAttempts.count += 1;
              })
            ),
            Effect.tapError((error) =>
              Effect.sync(() => {
                llmAttempts.count += 1;
              }).pipe(
                Effect.andThen(
                  obs.setWideEvent({
                    "llm.attempt.failed": llmAttempts.count,
                    "llm.lastError": String(error),
                  })
                )
              )
            ),
            Effect.retry({ schedule: retryOnce }),
            Effect.timeoutOrElse({
              duration: OPERATION_BUDGET,
              orElse: () =>
                Effect.fail(
                  new SkillExecutionError({
                    message: `LLM total budget exceeded (${OPERATION_BUDGET})`,
                  })
                ),
            }),
            Effect.map((r) => (r.ok ? r.cleanText : sttResult.text)),
            Effect.catch((error) =>
              obs
                .setWideEvent({
                  "llm.allAttemptsFailed": true,
                  "llm.budgetExceeded":
                    error._tag === "SkillExecutionError" &&
                    error.message.startsWith("LLM total budget"),
                  "llm.finalError": String(error),
                })
                .pipe(Effect.andThen(Effect.succeed(sttResult.text)))
            ),
            Effect.withSpan("guest.llm-cleanup"),
            Effect.provide(makeDemoSkillLayer(deps))
          )
        : Effect.succeed(sttResult.text)
    ).pipe(Effect.timed);

    const llmWallMs = Duration.toMillis(llmWallDuration);
    yield* obs.setWideEvent({
      "llm.end": true,
      "llm.attempts": llmAttempts.count,
      llmWallMs,
    });

    yield* background.defer(
      repo.markComplete({
        workflowId: jobId,
        rawText: sttResult.text,
        cleanText,
        durationMs: sttResult.durationMs,
        wordCount: sttResult.wordCount,
      })
    );

    yield* obs.setWideEvent({ directTranscribeCompleted: true });

    return {
      rawText: sttResult.text,
      cleanText,
      durationMs: sttResult.durationMs,
      wordCount: sttResult.wordCount,
    };
  }),

  startSkill: Effect.fnUntraced(function* (input: StartGuestSkillInput) {
    const { obs, repo, background } = deps;
    const { agentId, skillId, locale, inputText } = input;
    const jobId = crypto.randomUUID();
    const wordCount = countWords(inputText);
    const gatewayMetadata = {
      jobId,
      flow: "guest.skill",
      agentId,
      skillId,
      stage: "llm",
    } as const;

    yield* obs.setWideEvent({
      "guest.operation": "skill_start",
      jobId,
      agentId,
      skillId,
      locale,
      inputTextLength: inputText.length,
      wordCount,
    });

    yield* repo
      .insert({
        workflowId: jobId,
        kind: "skill",
        surfaceId: null,
        skillId,
        rawText: inputText,
        audioBytes: null,
        wordCount,
        locale,
        ipHash: agentId,
      })
      .pipe(Effect.withSpan("guest.d1-insert"));

    const llmAttempts = { count: 0 };
    yield* obs.setWideEvent({ "llm.start": true });
    const [llmWallDuration, cleanText] = yield* runDemoSkill({
      rawText: inputText,
      skillKeys: [skillId],
      gatewayMetadata,
    }).pipe(
      Effect.tap(() =>
        Effect.sync(() => {
          llmAttempts.count += 1;
        })
      ),
      Effect.tapError((error) =>
        Effect.sync(() => {
          llmAttempts.count += 1;
        }).pipe(
          Effect.andThen(
            obs.setWideEvent({
              "llm.attempt.failed": llmAttempts.count,
              "llm.lastError": String(error),
            })
          )
        )
      ),
      Effect.retry({ schedule: retryOnce }),
      Effect.timeoutOrElse({
        duration: OPERATION_BUDGET,
        orElse: () =>
          Effect.fail(
            new SkillExecutionError({
              message: `LLM total budget exceeded (${OPERATION_BUDGET})`,
            })
          ),
      }),
      Effect.map((r) => (r.ok ? r.cleanText : inputText)),
      Effect.catch((error) =>
        obs
          .setWideEvent({
            "llm.allAttemptsFailed": true,
            "llm.budgetExceeded":
              error._tag === "SkillExecutionError" && error.message.startsWith("LLM total budget"),
            "llm.finalError": String(error),
          })
          .pipe(Effect.andThen(Effect.succeed(inputText)))
      ),
      Effect.withSpan("guest.llm-skill"),
      Effect.provide(makeDemoSkillLayer(deps)),
      Effect.timed
    );

    const llmWallMs = Duration.toMillis(llmWallDuration);
    yield* obs.setWideEvent({
      "llm.end": true,
      "llm.attempts": llmAttempts.count,
      llmWallMs,
    });
    const cleanWordCount = countWords(cleanText);

    yield* background.defer(
      repo.markComplete({
        workflowId: jobId,
        rawText: inputText,
        cleanText,
        durationMs: null,
        wordCount: cleanWordCount,
      })
    );

    yield* obs.setWideEvent({
      directSkillCompleted: true,
      cleanTextLength: cleanText.length,
      cleanWordCount,
    });

    return { cleanText, wordCount: cleanWordCount };
  }),
});
