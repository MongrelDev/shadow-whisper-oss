import { Context, type Effect } from "effect";
import type { SurfaceContext } from "@whisper/api";
import type { ActionModeExecutionError } from "../../errors";
import type { ActionResult } from "../../domain/action-result";

export interface ActionAgentRunInput {
  readonly userId: string;
  readonly audio: Blob;
  readonly contentType: string;
  readonly locale: string;
  readonly selectedText: string | null;
  readonly timezone: string;
  readonly language: string | null;
  readonly platform: "desktop" | "extension";
  readonly os: string;
  readonly surfaceContext: SurfaceContext | null;
  readonly bundleId: string | null;
  readonly siteHost: string | null;
}

export interface ActionAgentRunnerService {
  readonly run: (
    input: ActionAgentRunInput
  ) => Effect.Effect<ActionResult, ActionModeExecutionError>;
}

export class ActionAgentRunner extends Context.Service<
  ActionAgentRunner,
  ActionAgentRunnerService
>()("ActionAgentRunner") {}
