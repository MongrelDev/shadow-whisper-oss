import { Context, Effect } from "effect";
import type { FeedbackPersistError } from "../../errors";

export interface CandidatePair {
  readonly from: string;
  readonly to: string;
}

export interface IngestTeachInput {
  readonly userId: string;
  readonly selectedText: string;
  readonly lastTranscriptionText: string | null;
  readonly source: "manual" | "auto-edit";
  readonly candidates: ReadonlyArray<CandidatePair>;
}

export interface IngestTeachResult {
  readonly feedbackId: string;
  readonly instanceId: string | null;
}

export interface TeachWorkflowClientService {
  readonly ingestTeach: (
    input: IngestTeachInput
  ) => Effect.Effect<IngestTeachResult, FeedbackPersistError>;
}

export class TeachWorkflowClient extends Context.Service<
  TeachWorkflowClient,
  TeachWorkflowClientService
>()("TeachWorkflowClient") {}
