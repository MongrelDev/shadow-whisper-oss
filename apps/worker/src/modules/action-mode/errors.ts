import { Data } from "effect";

export class ActionModeExecutionError extends Data.TaggedError("ActionModeExecutionError")<{
  readonly message: string;
}> {}

export class ActionTransformError extends Data.TaggedError("ActionTransformError")<{
  readonly message: string;
}> {}
