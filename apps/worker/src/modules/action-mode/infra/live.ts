import { Layer } from "effect";
import { ActionAgentRunner } from "../application/ports/action-agent-runner";
import { ActionModeServiceLive } from "../application/action-mode-service";
import { makeAgentBackedActionRunner } from "./agent-backed-action-runner";

export const ActionModeLive = (env: Env) => {
  const InfraLive = Layer.succeed(ActionAgentRunner, makeAgentBackedActionRunner(env));
  return Layer.mergeAll(InfraLive, ActionModeServiceLive.pipe(Layer.provide(InfraLive)));
};
