import { Context, Effect } from "effect";
import type { FeedbackPersistError } from "../../errors";

export interface PendingSuggestion {
  readonly id: string;
  readonly feedbackId: string;
  readonly original: string;
  readonly replacement: string;
  readonly context: string;
  readonly selectedText: string;
  readonly source: string;
  readonly status: string;
  readonly createdAt: number;
}

export type SuggestionMutationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: "not_found" };

export interface CreatePendingSuggestionInput {
  readonly feedbackId: string;
  readonly original: string;
  readonly replacement: string;
  readonly context: string;
  readonly selectedText: string;
  readonly source: string;
  readonly matchedSessionId: string | null;
  readonly now: number;
}

export interface PendingSuggestionsRepositoryService {
  readonly create: (
    userId: string,
    input: CreatePendingSuggestionInput
  ) => Effect.Effect<PendingSuggestion, FeedbackPersistError>;
  readonly list: (
    userId: string
  ) => Effect.Effect<ReadonlyArray<PendingSuggestion>, FeedbackPersistError>;
  readonly accept: (
    userId: string,
    id: string,
    now: number
  ) => Effect.Effect<SuggestionMutationResult, FeedbackPersistError>;
  readonly reject: (
    userId: string,
    id: string
  ) => Effect.Effect<SuggestionMutationResult, FeedbackPersistError>;
}

export class PendingSuggestionsRepository extends Context.Service<
  PendingSuggestionsRepository,
  PendingSuggestionsRepositoryService
>()("PendingSuggestionsRepository") {}
