import { Context, Effect } from "effect";
import type { FeedbackPersistError } from "../../errors";
import type { CleanupFeedbackEntry } from "../../domain/cleanup-feedback";

export interface CleanupFeedbackRepositoryService {
  readonly record: (entry: CleanupFeedbackEntry) => Effect.Effect<void, FeedbackPersistError>;
}

export class CleanupFeedbackRepository extends Context.Service<
  CleanupFeedbackRepository,
  CleanupFeedbackRepositoryService
>()("CleanupFeedbackRepository") {}
