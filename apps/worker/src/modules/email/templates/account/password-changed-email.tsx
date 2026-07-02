import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface PasswordChangedEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly resetUrl: string;
  readonly appBaseUrl: string;
}

export function PasswordChangedEmail({
  locale,
  firstName,
  resetUrl,
  appBaseUrl,
}: PasswordChangedEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_account_password_changed_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_account_password_changed_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_account_password_changed_heading_intro({ firstName }, { locale })}
          muted={m.email_account_password_changed_heading_muted({}, { locale })}
          accent={m.email_account_password_changed_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>{m.email_account_password_changed_lead({}, { locale })}</BaseEmail.Lead>
        <BaseEmail.Actions>
          <BaseEmail.Button href={resetUrl}>
            {m.email_account_password_changed_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_account_password_changed_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
