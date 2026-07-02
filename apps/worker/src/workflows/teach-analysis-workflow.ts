import { WorkflowEntrypoint, type WorkflowEvent, type WorkflowStep } from "cloudflare:workers";
import { Cause, Effect, Exit, Layer } from "effect";
import { AutoEditValidator } from "../modules/feedback/application/ports/auto-edit-validator";
import { PendingSuggestionsRepository } from "../modules/feedback/application/ports/pending-suggestions-repository";
import { makeWorkersAiAutoEditValidator } from "../modules/feedback/infra/workers-ai-auto-edit-validator";
import { PendingSuggestionsRepositoryLive } from "../modules/feedback/infra/live";
import { emitOneShotWideEvent } from "../observability/emit-one-shot-wide-event";
import type { WideEventFields } from "../observability/wide-event";
import type { OneShotWideEventOptions } from "../observability/emit-one-shot-wide-event";

// Failures must surface as plain Errors so the Workflows runtime can retry the
// step with a readable message instead of an opaque FiberFailure.
const runStepEffect = async <A, E>(effect: Effect.Effect<A, E>): Promise<A> => {
  const exit = await Effect.runPromiseExit(effect);
  return Exit.match(exit, {
    onSuccess: (value) => value,
    onFailure: (cause) => {
      Effect.runFork(Effect.logError("TeachAnalysisWorkflow step failed", cause));
      throw new Error(Cause.pretty(cause));
    },
  });
};

// Observability is best-effort: a failed emission must not fail (and re-run)
// the whole step.
const emitBestEffort = async (
  env: Env,
  name: string,
  fields: WideEventFields,
  options?: OneShotWideEventOptions
): Promise<void> => {
  const exit = await Effect.runPromiseExit(emitOneShotWideEvent(env, name, fields, options));
  Exit.match(exit, {
    onSuccess: () => undefined,
    onFailure: (cause) => {
      Effect.runFork(Effect.logError("TeachAnalysisWorkflow wide event emission failed", cause));
    },
  });
};

export interface TeachAnalysisWorkflowOptions {
  readonly autoEditValidatorLayer?: Layer.Layer<AutoEditValidator>;
}

const _test = { overrides: undefined as TeachAnalysisWorkflowOptions | undefined };

export const _testRuntime = {
  setOverrides: (opts: TeachAnalysisWorkflowOptions) => {
    _test.overrides = opts;
  },
  reset: () => {
    _test.overrides = undefined;
  },
};

export type TeachAnalysisSource = "manual" | "auto-edit";

export interface TeachAnalysisCandidate {
  from: string;
  to: string;
}

export interface TeachAnalysisParams {
  feedbackId: string;
  userId: string;
  selectedText: string;
  lastTranscriptionText: string | null;
  source?: TeachAnalysisSource;
  candidates?: ReadonlyArray<TeachAnalysisCandidate>;
}

interface AcceptedPair {
  from: string;
  to: string;
  context: string;
}

export class TeachAnalysisWorkflow extends WorkflowEntrypoint<Env, TeachAnalysisParams> {
  private async validateAutoEdit(
    feedbackId: string,
    originalText: string,
    editedText: string,
    candidates: ReadonlyArray<TeachAnalysisCandidate>,
    step: WorkflowStep
  ): Promise<AcceptedPair[]> {
    return step.do("auto-edit-validate", async () => {
      const startedAt = Date.now();
      const result = await runStepEffect(
        Effect.gen(function* () {
          const validator = yield* AutoEditValidator;
          return yield* validator.validate({
            originalText,
            editedText,
            candidates: candidates.map((c) => ({ from: c.from, to: c.to })),
          });
        }).pipe(
          Effect.provide(
            _test.overrides?.autoEditValidatorLayer ??
              Layer.succeed(AutoEditValidator, makeWorkersAiAutoEditValidator(this.env))
          )
        )
      );
      const latencyMs = Date.now() - startedAt;
      await emitBestEffort(this.env, "auto_teach.validated", {
        feedback_id: feedbackId,
        candidates_received: candidates.length,
        candidates_accepted: result.accepted.length,
        latency_ms: latencyMs,
      });
      return result.accepted.map((a) => ({ from: a.from, to: a.to, context: a.context }));
    });
  }

  private async persistPairs(
    feedbackId: string,
    userId: string,
    selectedText: string,
    pairs: ReadonlyArray<AcceptedPair>,
    source: TeachAnalysisSource,
    step: WorkflowStep
  ): Promise<void> {
    await step.do("persist", async () => {
      const now = Date.now();
      await runStepEffect(
        Effect.gen(function* () {
          const repo = yield* PendingSuggestionsRepository;
          for (const pair of pairs) {
            yield* repo.create(userId, {
              feedbackId,
              original: pair.from,
              replacement: pair.to,
              context: pair.context ?? "",
              selectedText,
              source,
              matchedSessionId: null,
              now,
            });
          }
        }).pipe(Effect.provide(PendingSuggestionsRepositoryLive(this.env)))
      );
      await emitBestEffort(this.env, "auto_teach.persisted", {
        feedback_id: feedbackId,
        pairs_persisted: pairs.length,
        source,
      });
    });
  }

  private shouldSkip(params: TeachAnalysisParams): string | null {
    const source = params.source ?? "manual";
    if (source !== "auto-edit") return "manual-teach-not-implemented";
    if (params.lastTranscriptionText === null) return "no-transcription";
    if ((params.candidates ?? []).length === 0) return "no-candidates";
    return null;
  }

  override async run(event: WorkflowEvent<TeachAnalysisParams>, step: WorkflowStep): Promise<void> {
    const { feedbackId, userId, selectedText, lastTranscriptionText } = event.payload;
    const candidates = event.payload.candidates ?? [];

    const skipReason = this.shouldSkip(event.payload);
    if (skipReason !== null) {
      await emitBestEffort(this.env, "auto_teach.skipped", {
        feedback_id: feedbackId,
        reason: skipReason,
      });
      return;
    }

    const accepted = await this.validateAutoEdit(
      feedbackId,
      lastTranscriptionText as string,
      selectedText,
      candidates,
      step
    );

    if (accepted.length === 0) return;

    await this.persistPairs(feedbackId, userId, selectedText, accepted, "auto-edit", step);
  }
}
