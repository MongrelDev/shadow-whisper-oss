import { Clock, Context, Effect, Layer, Schedule } from "effect";
import type { UnknownError } from "effect/Cause";
import { Observability } from "../../../observability/observability";
import { captureWideEventError } from "../../../observability/observability";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import type { SkillLoaderError } from "../../skills/domain/types";
import { countWords } from "../../../lib/count-words";
import { SkillExecutor } from "../application/ports/skill-executor";
import { SkillUsageRecorder } from "../application/ports/skill-usage-recorder";
import { SkillSyncExecutionError, SkillNotFoundError } from "../errors";
import type { SkillDatabaseError } from "../errors";
import { CustomSkillRepository } from "../application/ports/custom-skill-repository";

export interface ExecuteSkillSyncInput {
  readonly userId: string;
  readonly skillId: string;
  readonly inputText: string;
  readonly locale?: string;
  readonly os?: string;
  readonly timezone?: string;
  readonly language?: string | null;
}

export interface ExecuteSkillSyncResult {
  readonly executionId: string;
  readonly cleanText: string;
  readonly wordCount: number;
}

export interface SkillSyncExecutorShape {
  readonly execute: (
    input: ExecuteSkillSyncInput
  ) => Effect.Effect<
    ExecuteSkillSyncResult,
    | SkillNotFoundError
    | SkillSyncExecutionError
    | SkillLoaderError
    | SkillDatabaseError
    | UnknownError,
    Observability
  >;
}

export class SkillSyncExecutor extends Context.Service<SkillSyncExecutor, SkillSyncExecutorShape>()(
  "SkillSyncExecutor"
) {}

const RETRY_SCHEDULE = Schedule.exponential("100 millis").pipe(Schedule.take(3));

export const SkillSyncExecutorLive = Layer.effect(
  SkillSyncExecutor,
  Effect.gen(function* () {
    const skillRepo = yield* SkillRepository;
    const executor = yield* SkillExecutor;
    const usage = yield* SkillUsageRecorder;
    const customRepo = yield* CustomSkillRepository;

    const resolveSkill = Effect.fnUntraced(function* (userId: string, skillId: string) {
      const official = skillRepo.getById(skillId);
      if (official) {
        return {
          id: official.id,
          slug: official.slug,
          displayName: official.displayName,
          source: "official" as const,
          markdown: yield* skillRepo.compose([official.id]),
        };
      }
      const custom = yield* customRepo.get(userId, skillId);
      if (!custom) return yield* new SkillNotFoundError({ id: skillId });
      return {
        id: custom.id,
        slug: custom.slug,
        displayName: custom.displayName,
        source: "custom" as const,
        markdown: custom.markdown,
      };
    });

    return SkillSyncExecutor.of({
      execute: Effect.fnUntraced(function* ({
        userId,
        skillId,
        inputText,
        locale,
        os,
        timezone,
        language,
      }: ExecuteSkillSyncInput) {
        const usageDimensions = {
          platform: "desktop" as const,
          os: os || "unknown",
          language: language ?? null,
          timezone: timezone || "UTC",
        };
        const obs = yield* Observability;

        yield* obs.setWideEvent({
          "skills.operation": "execute_sync",
          skillId,
          inputTextLength: inputText.length,
          locale: locale ?? "en",
        });

        const resolved = yield* resolveSkill(userId, skillId).pipe(
          Effect.withSpan("skills.resolve", { attributes: { "skill.id": skillId } })
        );

        yield* obs.setWideEvent({
          skillSlug: resolved.slug,
          skillSource: resolved.source,
        });

        const executionId = crypto.randomUUID();
        const startedAt = yield* Clock.currentTimeMillis;
        const skillMarkdown = resolved.markdown;
        const gatewayMetadata = {
          flow: "skills.execute-sync",
          skillId: resolved.id,
          userId,
          executionId,
        } as const;

        const cleanText = yield* executor
          .execute({ skillMarkdown, inputText, gatewayMetadata })
          .pipe(
            Effect.retry(RETRY_SCHEDULE),
            Effect.withSpan("skills.execute-sync", {
              attributes: {
                "skill.id": resolved.id,
                "skill.slug": resolved.slug,
                "skill.source": resolved.source,
                "input.length": inputText.length,
              },
            }),
            Effect.mapError((e) => new SkillSyncExecutionError({ message: e.message })),
            Effect.tapError(() =>
              Effect.gen(function* () {
                const finishedAt = yield* Clock.currentTimeMillis;
                yield* usage
                  .record(userId, {
                    skillId: resolved.id,
                    skillVersion: 1,
                    inputWordCount: countWords(inputText),
                    outputWordCount: 0,
                    durationMs: finishedAt - startedAt,
                    success: false,
                    ...usageDimensions,
                  })
                  .pipe(
                    Effect.tapError((e) =>
                      obs.setWideEvent({ usageRecordFailurePathError: e.message })
                    ),
                    Effect.catch(() => Effect.void)
                  );
              })
            )
          );

        const finishedAt = yield* Clock.currentTimeMillis;
        const durationMs = finishedAt - startedAt;
        const wordCount = countWords(cleanText);

        yield* usage
          .record(userId, {
            skillId: resolved.id,
            skillVersion: 1,
            inputWordCount: countWords(inputText),
            outputWordCount: wordCount,
            durationMs,
            success: true,
            ...usageDimensions,
          })
          .pipe(
            Effect.tapError((e) => obs.setWideEvent({ usageRecordError: e.message })),
            Effect.catch(() => Effect.void)
          );

        yield* obs.setWideEvent({
          executionId,
          outputLength: cleanText.length,
          executionDurationMs: durationMs,
          outputWordCount: wordCount,
        });

        return { executionId, cleanText, wordCount } satisfies ExecuteSkillSyncResult;
      }, captureWideEventError),
    });
  })
);
