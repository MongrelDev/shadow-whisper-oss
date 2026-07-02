import { Data } from "effect";

export class GuestJobRepositoryError extends Data.TaggedError("GuestJobRepositoryError")<{
  readonly message: string;
}> {}

export class BootError extends Data.TaggedError("BootError")<{
  readonly message: string;
}> {}

export class BootRequiredError extends Data.TaggedError("BootRequiredError") {}

export class GuestSessionAuthError extends Data.TaggedError("GuestSessionAuthError")<{
  readonly reason: "missing_token" | "invalid" | "expired" | "wrong_identity" | "wrong_purpose";
}> {}
