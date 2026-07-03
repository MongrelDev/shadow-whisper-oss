import { Context, Effect, Layer } from "effect";
import type { UnknownError } from "effect/Cause";
import { SubscriptionService } from "../../billing/application/subscription-service";
import type { BillingDatabaseError, LimitExceededError } from "../../billing/errors";
import { Observability } from "../../../observability/observability";
import { ActionAgentRunner, type ActionAgentRunInput } from "./ports/action-agent-runner";
import type { ActionModeExecutionError } from "../errors";
import type { ActionResult } from "../domain/action-result";

export type ExecuteActionInput = ActionAgentRunInput;

export interface ActionModeServiceShape {
  readonly execute: (
    input: ExecuteActionInput
  ) => Effect.Effect<
    ActionResult,
    ActionModeExecutionError | BillingDatabaseError | LimitExceededError | UnknownError
  >;
}

export class ActionModeService extends Context.Service<ActionModeService, ActionModeServiceShape>()(
  "ActionModeService"
) {}

export const ActionModeServiceLive = Layer.effect(
  ActionModeService,
  Effect.gen(function* () {
    const obs = yield* Observability;
    const sub = yield* SubscriptionService;
    const runner = yield* ActionAgentRunner;

    return ActionModeService.of({
      execute: Effect.fnUntraced(
        function* (input) {
          yield* obs.setWideEvent({
            "action_mode.operation": "execute",
            audioBytes: input.audio.size,
            locale: input.locale,
            hasSelectedText: input.selectedText !== null,
            selectedTextLength: input.selectedText?.length ?? 0,
            hasBundleId: input.bundleId !== null,
            bundleId: input.bundleId,
            siteHost: input.siteHost,
          });

          yield* sub.checkLimits(input.userId);

          const result = yield* runner.run(input);

          yield* obs.setWideEvent({
            actionModeCompleted: true,
            instructionWordCount: result.instructionWordCount,
            outputWordCount: result.outputWordCount,
            sttEngine: result.sttEngine,
          });

          return result;
        },
        Effect.tapError((error) => obs.failWideEvent(error))
      ),
    });
  })
);
