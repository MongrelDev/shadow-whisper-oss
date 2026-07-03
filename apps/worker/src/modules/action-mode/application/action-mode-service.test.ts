import { describe, expect, it } from "@effect/vitest";
import { Effect, Exit, Layer } from "effect";
import { NoopObservabilityLive } from "../../../observability/observability";
import {
  SubscriptionService,
  type SubscriptionServiceShape,
} from "../../billing/application/subscription-service";
import { LimitExceededError } from "../../billing/errors";
import { ActionModeService, ActionModeServiceLive } from "./action-mode-service";
import {
  ActionAgentRunner,
  type ActionAgentRunInput,
  type ActionAgentRunnerService,
} from "./ports/action-agent-runner";
import type { ActionResult } from "../domain/action-result";
import { ActionModeExecutionError } from "../errors";

const USER_ID = "user-1";

const runResult: ActionResult = {
  instructionText: "translate this",
  outputText: "traduza isso",
  instructionWordCount: 2,
  outputWordCount: 2,
  sttEngine: "stub-stt",
  durationMs: 1200,
};

interface Capture {
  runInput?: ActionAgentRunInput;
  checkedUserId?: string;
}

const okLimits = {
  usage: { spokenWords: 0, transformedWords: 0, totalWords: 0 },
  plan: "free" as const,
  limit: 10_000,
};

const makeSubscription = (
  capture: Capture,
  outcome: Effect.Effect<typeof okLimits, LimitExceededError> = Effect.succeed(okLimits)
): SubscriptionServiceShape => ({
  checkLimits: (userId) => {
    capture.checkedUserId = userId;
    return outcome;
  },
  getStatus: () => Effect.die("not used"),
});

const makeRunner = (
  capture: Capture,
  outcome: Effect.Effect<ActionResult, ActionModeExecutionError> = Effect.succeed(runResult)
): ActionAgentRunnerService => ({
  run: (input) => {
    capture.runInput = input;
    return outcome;
  },
});

const baseInput: ActionAgentRunInput = {
  userId: USER_ID,
  audio: new Blob(["audio-bytes"], { type: "audio/webm" }),
  contentType: "audio/webm",
  locale: "auto",
  selectedText: "hello",
  timezone: "UTC",
  language: "en",
  platform: "desktop",
  os: "macos",
  surfaceContext: null,
  bundleId: "com.google.Chrome",
  siteHost: "docs.google.com",
};

function buildLayer(opts: {
  capture: Capture;
  limitsOutcome?: Effect.Effect<typeof okLimits, LimitExceededError>;
  runnerOutcome?: Effect.Effect<ActionResult, ActionModeExecutionError>;
}) {
  return ActionModeServiceLive.pipe(
    Layer.provide([
      Layer.succeed(SubscriptionService, makeSubscription(opts.capture, opts.limitsOutcome)),
      Layer.succeed(ActionAgentRunner, makeRunner(opts.capture, opts.runnerOutcome)),
      NoopObservabilityLive,
    ])
  );
}

function runExecute(
  input: ActionAgentRunInput,
  layer: ReturnType<typeof buildLayer>
): Effect.Effect<Exit.Exit<unknown, unknown>> {
  return Effect.gen(function* () {
    const service = yield* ActionModeService;
    return yield* service.execute(input);
  }).pipe(Effect.provide(layer), Effect.exit);
}

describe("ActionModeService", () => {
  it.effect("checks limits, runs the agent, and maps the result", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const exit = yield* runExecute(baseInput, buildLayer({ capture }));

      expect(capture.checkedUserId).toBe(USER_ID);
      expect(capture.runInput?.selectedText).toBe("hello");
      expect(capture.runInput?.bundleId).toBe("com.google.Chrome");
      expect(exit).toStrictEqual(
        Exit.succeed({
          instructionText: "translate this",
          outputText: "traduza isso",
          instructionWordCount: 2,
          outputWordCount: 2,
          sttEngine: "stub-stt",
          durationMs: 1200,
        })
      );
    })
  );

  it.effect("fails with LimitExceededError before reaching the agent", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const limitError = new LimitExceededError({
        message: "Weekly word limit reached",
        usage: { totalWords: 10_000, limit: 10_000 },
      });
      const exit = yield* runExecute(
        baseInput,
        buildLayer({ capture, limitsOutcome: Effect.fail(limitError) })
      );

      expect(capture.runInput).toBeUndefined();
      expect(exit).toStrictEqual(Exit.fail(limitError));
    })
  );

  it.effect("propagates agent execution failures", () =>
    Effect.gen(function* () {
      const capture: Capture = {};
      const executionError = new ActionModeExecutionError({ message: "stt_failed" });
      const exit = yield* runExecute(
        baseInput,
        buildLayer({ capture, runnerOutcome: Effect.fail(executionError) })
      );

      expect(exit).toStrictEqual(Exit.fail(executionError));
    })
  );
});
