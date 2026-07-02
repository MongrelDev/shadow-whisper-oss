import { Effect } from "effect";
import type {
  EmailServiceContract,
  SendPasswordResetEmailInput,
  SendVerificationEmailInput,
} from "../application/ports/email-service";
import { EmailSendError } from "../application/ports/email-service";

const DEFAULT_FROM_ADDRESS = "noreply@shadowwhisper.local";
const DEFAULT_FROM_NAME = "ShadowWhisper";
const DEFAULT_REPLY_TO = "support@shadowwhisper.local";

function getEmailFrom(env: Env): EmailAddress {
  return {
    name: env.AUTH_EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    email: env.AUTH_EMAIL_FROM_ADDRESS || DEFAULT_FROM_ADDRESS,
  };
}

function getEmailReplyTo(env: Env): EmailAddress {
  return {
    name: env.AUTH_EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    email: env.AUTH_EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
  };
}

function getAppBaseUrl(env: Env, appBaseUrl?: string): string {
  return appBaseUrl ?? env.APP_URL;
}

async function sendRenderedEmail(
  env: Env,
  input: {
    readonly to: string;
    readonly subject: string;
    readonly html: string;
    readonly text: string;
    readonly headerType: string;
  }
) {
  await env.EMAIL.send({
    from: getEmailFrom(env),
    to: input.to,
    subject: input.subject,
    replyTo: getEmailReplyTo(env),
    text: input.text,
    html: input.html,
    headers: {
      "X-ShadowWhisper-Email-Type": input.headerType,
    },
  });
}

function sendVerification(env: Env, input: SendVerificationEmailInput) {
  return Effect.tryPromise({
    try: async () => {
      const { renderVerificationEmail } = await import("./react-email-renderer");
      const rendered = await renderVerificationEmail({
        ...input,
        appBaseUrl: getAppBaseUrl(env, input.appBaseUrl),
      });
      await sendRenderedEmail(env, { ...rendered, to: input.to });
    },
    catch: (cause) =>
      new EmailSendError({
        message: "Failed to send verification email",
        cause,
      }),
  });
}

function sendPasswordReset(env: Env, input: SendPasswordResetEmailInput) {
  return Effect.tryPromise({
    try: async () => {
      const { renderPasswordResetEmail } = await import("./react-email-renderer");
      const rendered = await renderPasswordResetEmail({
        ...input,
        appBaseUrl: getAppBaseUrl(env, input.appBaseUrl),
      });
      await sendRenderedEmail(env, { ...rendered, to: input.to });
    },
    catch: (cause) =>
      new EmailSendError({
        message: "Failed to send password reset email",
        cause,
      }),
  });
}

export function makeEmailService(env: Env): EmailServiceContract {
  return {
    sendVerificationEmail: (input) => sendVerification(env, input),
    sendPasswordResetEmail: (input) => sendPasswordReset(env, input),
  };
}
