import { Effect } from "effect";
import type {
  IngestTeachResult,
  TeachWorkflowClientService,
} from "../application/ports/teach-workflow-client";
import { FeedbackPersistError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeTeachWorkflowClient = (env: Env): TeachWorkflowClientService => ({
  ingestTeach: ({ userId, selectedText, lastTranscriptionText, source, candidates }) =>
    Effect.gen(function* () {
      const workflow = env.TEACH_ANALYSIS_WORKFLOW;
      if (!workflow) {
        return yield* new FeedbackPersistError({
          message: "TEACH_ANALYSIS_WORKFLOW binding is not configured",
        });
      }
      return yield* Effect.tryPromise({
        try: async (): Promise<IngestTeachResult> => {
          const feedbackId = crypto.randomUUID();
          const instance = await workflow.create({
            id: crypto.randomUUID(),
            params: {
              feedbackId,
              userId,
              selectedText,
              lastTranscriptionText,
              source,
              candidates: candidates.map((c) => ({ from: c.from, to: c.to })),
            },
          });
          return { feedbackId, instanceId: instance.id };
        },
        catch: (e): FeedbackPersistError =>
          new FeedbackPersistError({
            message: `teach workflow create failed: ${unknownMessage(e)}`,
          }),
      });
    }),
});
