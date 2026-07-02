import { Context, Effect } from "effect";
import type { AppCategory } from "../../domain/app-category";
import type { RoutingCatalog } from "./text-generator";
import type { TextImproverError, TextImproverParams } from "./text-improver";

// What the resolved app context contributes to a flow. The selector picks the flow
// from the mode; the flow reads the environment from here to shape its directive.
export interface FlowContext {
  readonly category: AppCategory | null;
}

// Everything a mode contributes to the prompt that differs from the shared harness
// (identity, session context, writing guidance, execution policy stay common):
//   - directive: the mode-specific system section (intent router vs forced skill)
//   - userHeader: the first line of the user message
//   - routing: the generator's tool catalog — absent when no tools are offered
export interface ModeContribution {
  readonly directive: string;
  readonly userHeader: string;
  readonly routing?: RoutingCatalog;
}

// One mode's behaviour, with its own injected dependencies already bound. The flow
// is the polymorphic unit that replaces the `params.mode === ...` branching.
export interface ImprovementFlow {
  readonly contribute: (ctx: FlowContext) => Effect.Effect<ModeContribution, TextImproverError>;
}

// The single seam where mode is inspected: maps params to the flow that handles them.
// This is the "which layer to mount" decision — the one allowed switch, localized here
// instead of scattered through the orchestration.
export interface ImprovementFlowSelectorService {
  readonly forParams: (params: TextImproverParams) => ImprovementFlow;
}

export class ImprovementFlowSelector extends Context.Service<
  ImprovementFlowSelector,
  ImprovementFlowSelectorService
>()("ImprovementFlowSelector") {}
