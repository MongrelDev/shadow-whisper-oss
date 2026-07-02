import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface PasswordResetEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly resetUrl: string;
  readonly appBaseUrl: string;
}

export function PasswordResetEmail({
  locale,
  firstName,
  resetUrl,
  appBaseUrl,
}: PasswordResetEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_auth_password_reset_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>{m.email_auth_password_reset_eyebrow({}, { locale })}</BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_auth_password_reset_heading_intro({ firstName }, { locale })}
          muted={m.email_auth_password_reset_heading_muted({}, { locale })}
          accent={m.email_auth_password_reset_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>{m.email_auth_password_reset_lead({}, { locale })}</BaseEmail.Lead>
        <BaseEmail.Actions>
          <BaseEmail.Button href={resetUrl}>
            {m.email_auth_password_reset_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Divider />
        <BaseEmail.SectionLabel>
          {m.email_auth_password_reset_link_title({}, { locale })}
        </BaseEmail.SectionLabel>
        <BaseEmail.TextBlock>
          {m.email_auth_password_reset_link_intro({}, { locale })}
        </BaseEmail.TextBlock>
        <BaseEmail.MonoText>{resetUrl}</BaseEmail.MonoText>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_auth_password_reset_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
