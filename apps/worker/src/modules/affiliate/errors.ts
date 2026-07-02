import { Data } from "effect";

export class AffiliateDatabaseError extends Data.TaggedError("AffiliateDatabaseError")<{
  readonly message: string;
}> {}

export class InvalidAffiliateCodeError extends Data.TaggedError("InvalidAffiliateCodeError")<{
  readonly code: string;
}> {}

export class SelfReferralError extends Data.TaggedError("SelfReferralError")<{
  readonly userId: string;
}> {}

export class DuplicateReferralError extends Data.TaggedError("DuplicateReferralError")<{
  readonly referredUserId: string;
}> {}

export class SignupError extends Data.TaggedError("SignupError")<{
  readonly message: string;
}> {}

export class EmailAlreadyExistsError extends Data.TaggedError("EmailAlreadyExistsError")<{
  readonly email: string;
}> {}

export class DisposableEmailError extends Data.TaggedError("DisposableEmailError")<{
  readonly email: string;
}> {}

export class CodeGenerationError extends Data.TaggedError("CodeGenerationError")<{
  readonly message: string;
}> {}

export class StripeApiError extends Data.TaggedError("StripeApiError")<{
  readonly message: string;
  readonly operation: string;
}> {}
