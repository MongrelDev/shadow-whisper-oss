import { Effect } from "effect";
import { hmacAgentId } from "../../../lib/cookie";
import type { GuestAgentIdentityService } from "../application/ports/guest-agent-identity";
import { BootError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeHmacGuestAgentIdentity = (env: Env): GuestAgentIdentityService => ({
  derive: (cookieValue) =>
    Effect.tryPromise({
      try: () => hmacAgentId(env.GUEST_SECRET, cookieValue),
      catch: (e) => new BootError({ message: `hmac failed: ${unknownMessage(e)}` }),
    }),
});
