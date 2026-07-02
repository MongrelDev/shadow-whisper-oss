import { Effect, Layer } from "effect";
import { D1Client } from "@effect/sql-d1";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { AutoEditValidator } from "../application/ports/auto-edit-validator";
import { CleanupFeedbackRepository } from "../application/ports/cleanup-feedback-repository";
import { PendingSuggestionsRepository } from "../application/ports/pending-suggestions-repository";
import { TeachWorkflowClient } from "../application/ports/teach-workflow-client";
import { WordPairDetector } from "../application/ports/word-pair-detector";
import { FeedbackServiceLive } from "../application/feedback-service";
import { makeD1CleanupFeedbackRepository } from "./d1-cleanup-feedback-repository";
import { makeD1PendingSuggestionsRepository } from "./d1-pending-suggestions-repository";
import { makeTeachWorkflowClient } from "./teach-workflow-client";
import { makeWorkersAiAutoEditValidator } from "./workers-ai-auto-edit-validator";
import { makeWorkersAiWordPairDetector } from "./workers-ai-word-pair-detector";

export const PendingSuggestionsRepositoryLive = (env: Env) =>
  Layer.effect(
    PendingSuggestionsRepository,
    Effect.gen(function* () {
      const client = yield* D1Client.D1Client;
      return makeD1PendingSuggestionsRepository(client);
    })
  ).pipe(Layer.provide(D1SqlLive(env)));

export const FeedbackLive = (env: Env) => {
  const InfraLive = Layer.mergeAll(
    Layer.succeed(TeachWorkflowClient, makeTeachWorkflowClient(env)),
    Layer.succeed(WordPairDetector, makeWorkersAiWordPairDetector(env)),
    Layer.succeed(AutoEditValidator, makeWorkersAiAutoEditValidator(env)),
    PendingSuggestionsRepositoryLive(env),
    Layer.succeed(CleanupFeedbackRepository, makeD1CleanupFeedbackRepository(env))
  );

  const ServicesLive = FeedbackServiceLive.pipe(Layer.provide(InfraLive));

  return Layer.mergeAll(InfraLive, ServicesLive);
};
