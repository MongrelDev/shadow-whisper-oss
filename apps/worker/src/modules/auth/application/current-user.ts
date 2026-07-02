import { Context, Data, Effect } from "effect";

export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly reason?: string;
}> {}

export interface CurrentUserService {
  readonly userId: Effect.Effect<string, UnauthorizedError>;
}

export class CurrentUser extends Context.Service<CurrentUser, CurrentUserService>()(
  "CurrentUser"
) {}

export const currentUserId: Effect.Effect<string, UnauthorizedError, CurrentUser> = Effect.flatMap(
  CurrentUser,
  (cu) => cu.userId
);
