import { Context, type Effect } from "effect";
import type { AppRegistryCandidatesError } from "../../errors";

export interface TouchCandidateInput {
  readonly identifier: string;
  readonly identifierType: "bundle" | "host";
  readonly nowMs: number;
}

export interface AppRegistryCandidatesService {
  readonly touch: (input: TouchCandidateInput) => Effect.Effect<void, AppRegistryCandidatesError>;
}

export class AppRegistryCandidates extends Context.Service<
  AppRegistryCandidates,
  AppRegistryCandidatesService
>()("AppRegistryCandidates") {}
