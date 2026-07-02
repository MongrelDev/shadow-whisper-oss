import { Effect } from "effect";
import { isAPIError } from "better-auth/api";
import type { AuthSignupService } from "../application/ports/auth-signup";
import { SignupError, EmailAlreadyExistsError, DisposableEmailError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

interface BetterAuthSignupApi {
  readonly api: {
    signUpEmail(input: {
      body: {
        name: string;
        email: string;
        password: string;
        callbackURL?: string;
      };
    }): Promise<{
      user: {
        id: string;
        email: string;
        name: string;
      };
    }>;
  };
}

function mapSignupError(
  e: unknown,
  email: string
): EmailAlreadyExistsError | DisposableEmailError | SignupError {
  if (!isAPIError(e)) return new SignupError({ message: unknownMessage(e) });
  const code = e.body?.code;
  if (code === "USER_ALREADY_EXISTS") return new EmailAlreadyExistsError({ email });
  if (code === "DISPOSABLE_EMAIL") return new DisposableEmailError({ email });
  return new SignupError({ message: e.message });
}

export const makeAuthSignup = (auth: BetterAuthSignupApi): AuthSignupService => ({
  signUpEmail: (input) =>
    Effect.tryPromise({
      try: async () => {
        const result = await auth.api.signUpEmail({ body: input });
        return {
          userId: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };
      },
      catch: (e) => mapSignupError(e, input.email),
    }),
});
