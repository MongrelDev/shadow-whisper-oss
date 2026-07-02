import { render, toPlainText } from "@react-email/render";
import { createElement } from "react";
import { m } from "../../../paraglide/messages.js";
import type {
  SendPasswordResetEmailInput,
  SendVerificationEmailInput,
} from "../application/ports/email-service";
import type { RenderedEmailTemplate } from "../domain/email-template";
import { normalizeEmailLocale } from "../domain/email-locale";
import { PasswordResetEmail } from "../templates/auth/password-reset-email";
import { VerificationEmail } from "../templates/auth/verification-email";

function getFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name;
}

function renderTextEmail(lines: string[]) {
  return lines.join("\n");
}

export async function renderVerificationEmail(
  input: SendVerificationEmailInput & { appBaseUrl: string }
): Promise<RenderedEmailTemplate> {
  const locale = normalizeEmailLocale(input.locale);
  const firstName = getFirstName(input.name);

  const html = await render(
    createElement(VerificationEmail, {
      locale,
      firstName,
      verificationUrl: input.verificationUrl,
      appBaseUrl: input.appBaseUrl,
    })
  );

  return {
    subject: m.email_auth_verification_subject({}, { locale }),
    html,
    text:
      toPlainText(html) ||
      renderTextEmail([
        m.email_auth_verification_heading_intro({ firstName }, { locale }).replace(/\.$/, ","),
        "",
        m.email_auth_verification_text_intro({}, { locale }),
        "",
        input.verificationUrl,
        "",
        m.email_auth_verification_text_step({}, { locale }),
        "",
        m.email_auth_verification_text_expiry({}, { locale }),
        "",
        m.email_signature_team({}, { locale }),
        input.appBaseUrl,
      ]),
    headerType: "auth-verification",
  };
}

export async function renderPasswordResetEmail(
  input: SendPasswordResetEmailInput & { appBaseUrl: string }
): Promise<RenderedEmailTemplate> {
  const locale = normalizeEmailLocale(input.locale);
  const firstName = getFirstName(input.name);

  const html = await render(
    createElement(PasswordResetEmail, {
      locale,
      firstName,
      resetUrl: input.resetUrl,
      appBaseUrl: input.appBaseUrl,
    })
  );

  return {
    subject: m.email_auth_password_reset_subject({}, { locale }),
    html,
    text:
      toPlainText(html) ||
      renderTextEmail([
        m.email_auth_password_reset_heading_intro({ firstName }, { locale }).replace(/\.$/, ","),
        "",
        m.email_auth_password_reset_text_intro({}, { locale }),
        "",
        input.resetUrl,
        "",
        m.email_auth_password_reset_text_expiry({}, { locale }),
        "",
        m.email_signature_team({}, { locale }),
        input.appBaseUrl,
      ]),
    headerType: "auth-password-reset",
  };
}
