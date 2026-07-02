import { Context, Data, Effect } from "effect";
import type { EmailLocale } from "../../domain/email-locale";

export class EmailSendError extends Data.TaggedError("EmailSendError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

export interface SendVerificationEmailInput {
  readonly to: string;
  readonly name: string;
  readonly verificationUrl: string;
  readonly appBaseUrl?: string;
  readonly locale?: EmailLocale;
}

export interface SendPasswordResetEmailInput {
  readonly to: string;
  readonly name: string;
  readonly resetUrl: string;
  readonly appBaseUrl?: string;
  readonly locale?: EmailLocale;
}

export interface EmailServiceContract {
  readonly sendVerificationEmail: (
    input: SendVerificationEmailInput
  ) => Effect.Effect<void, EmailSendError>;
  readonly sendPasswordResetEmail: (
    input: SendPasswordResetEmailInput
  ) => Effect.Effect<void, EmailSendError>;
}

export class EmailService extends Context.Service<EmailService, EmailServiceContract>()(
  "EmailService"
) {}
