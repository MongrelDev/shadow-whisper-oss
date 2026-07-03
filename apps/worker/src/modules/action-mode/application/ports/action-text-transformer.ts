import { Context, type Effect } from "effect";
import type { GatewayMetadata } from "../../../../lib/gateway-metadata";
import type { ActionTransformError } from "../../errors";

export interface ActionTransformOutcome {
  readonly text: string;
  readonly engine: string;
}

export interface ActionTextTransformerService {
  readonly transform: (params: {
    readonly instruction: string;
    readonly selectedText: string | null;
    readonly gatewayMetadata?: GatewayMetadata;
  }) => Effect.Effect<ActionTransformOutcome, ActionTransformError>;
}

export class ActionTextTransformer extends Context.Service<
  ActionTextTransformer,
  ActionTextTransformerService
>()("ActionTextTransformer") {}
