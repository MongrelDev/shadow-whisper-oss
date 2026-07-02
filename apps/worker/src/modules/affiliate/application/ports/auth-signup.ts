import { Context, Effect } from "effect";
import type { SignupError, EmailAlreadyExistsError, DisposableEmailError } from "../../errors";

export interface SignupResult {
  readonly userId: string;
  readonly email: string;
  readonly name: string;
}

export interface AuthSignupService {
  readonly signUpEmail: (input: {
    name: string;
    email: string;
    password: string;
    callbackURL?: string;
  }) => Effect.Effect<SignupResult, SignupError | EmailAlreadyExistsError | DisposableEmailError>;
}

export class AuthSignup extends Context.Service<AuthSignup, AuthSignupService>()(
  "AffiliateAuthSignup"
) {}
