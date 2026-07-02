import { Context, Effect } from "effect";
import type { BootError } from "../../errors";

export interface GuestAgentIdentityService {
  readonly derive: (cookieValue: string) => Effect.Effect<string, BootError>;
}

export class GuestAgentIdentity extends Context.Service<
  GuestAgentIdentity,
  GuestAgentIdentityService
>()("GuestAgentIdentity") {}
