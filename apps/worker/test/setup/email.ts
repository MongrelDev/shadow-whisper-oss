import { Effect, Layer } from "effect";
import {
  EmailService,
  type EmailServiceContract,
} from "../../src/modules/email/application/ports/email-service";

export const testEmailService: EmailServiceContract = {
  sendVerificationEmail: () => Effect.void,
  sendPasswordResetEmail: () => Effect.void,
};

export const TestEmailLive = Layer.succeed(EmailService, testEmailService);
