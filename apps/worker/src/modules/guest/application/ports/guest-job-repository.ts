// Analytics-only port: row trail for guest jobs. Agents own live state; this row is
// updated at terminal transitions (complete/error/cancelled) for post-hoc review.
import { Context, Effect } from "effect";
import { GuestJobRepositoryError } from "../../errors";
import type { DemoJob, InsertDemoJobInput } from "../../domain/demo-job";

export interface MarkCompleteInput {
  readonly workflowId: string;
  readonly rawText: string;
  readonly cleanText: string;
  readonly durationMs: number | null;
  readonly wordCount: number;
}

export interface GuestJobRepositoryService {
  readonly insert: (input: InsertDemoJobInput) => Effect.Effect<void, GuestJobRepositoryError>;
  readonly markComplete: (input: MarkCompleteInput) => Effect.Effect<void, GuestJobRepositoryError>;
  readonly markError: (
    workflowId: string,
    message: string
  ) => Effect.Effect<void, GuestJobRepositoryError>;
  readonly markCancelled: (workflowId: string) => Effect.Effect<void, GuestJobRepositoryError>;
  readonly findById: (workflowId: string) => Effect.Effect<DemoJob | null, GuestJobRepositoryError>;
}

export class GuestJobRepository extends Context.Service<
  GuestJobRepository,
  GuestJobRepositoryService
>()("GuestJobRepository") {}
