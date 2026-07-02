import { Context, Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import type { FeedbackPersistError } from "../errors";
import {
  TeachWorkflowClient,
  type IngestTeachInput,
  type IngestTeachResult,
} from "./ports/teach-workflow-client";
import { filterCredentialCandidates } from "./credential-candidate-filter";

export type { IngestTeachInput };

export interface FeedbackServiceShape {
  readonly ingestTeach: (
    input: IngestTeachInput
  ) => Effect.Effect<IngestTeachResult, FeedbackPersistError>;
}

export class FeedbackService extends Context.Service<FeedbackService, FeedbackServiceShape>()(
  "FeedbackService"
) {}

export const FeedbackServiceLive = Layer.effect(
  FeedbackService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const client = yield* TeachWorkflowClient;

    return FeedbackService.of({
      ingestTeach: (input) =>
        Effect.gen(function* () {
          yield* obs.setWideEvent({
            "feedback.operation": "teach_ingest",
            "feedback.source": input.source,
            selectedTextLength: input.selectedText.length,
            lastTranscriptionPresent: input.lastTranscriptionText !== null,
            lastTranscriptionLength: input.lastTranscriptionText?.length ?? 0,
          });

          if (input.source === "auto-edit") {
            const received = input.candidates.length;
            const filtered = filterCredentialCandidates(input.candidates);
            yield* Effect.logInfo("auto-teach.candidate.filtered", {
              received,
              passed: filtered.length,
            });
            yield* obs.setWideEvent({
              "feedback.candidates.received": received,
              "feedback.candidates.passed": filtered.length,
            });

            if (filtered.length === 0) {
              const noop: IngestTeachResult = {
                feedbackId: crypto.randomUUID(),
                instanceId: null,
              };
              yield* obs.setWideEvent({ "feedback.autoEdit.noop": true });
              return noop;
            }

            const result = yield* client.ingestTeach({ ...input, candidates: filtered });
            yield* obs.setWideEvent({
              feedbackId: result.feedbackId,
              workflowInstancePresent: result.instanceId !== null,
            });
            return result;
          }

          const result = yield* client.ingestTeach(input);
          yield* obs.setWideEvent({
            feedbackId: result.feedbackId,
            workflowInstancePresent: result.instanceId !== null,
          });
          return result;
        }).pipe(Effect.tapError((error) => obs.failWideEvent(error))),
    });
  })
);
