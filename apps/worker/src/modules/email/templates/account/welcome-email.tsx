import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface WelcomeEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly appBaseUrl: string;
}

export function WelcomeEmail({ locale, firstName, appBaseUrl }: WelcomeEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_account_welcome_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>{m.email_account_welcome_eyebrow({}, { locale })}</BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_account_welcome_heading_intro({ firstName }, { locale })}
          muted={m.email_account_welcome_heading_muted({}, { locale })}
          accent={m.email_account_welcome_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>{m.email_account_welcome_lead({}, { locale })}</BaseEmail.Lead>
        <BaseEmail.Actions>
          <BaseEmail.Button href={appBaseUrl}>
            {m.email_account_welcome_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Divider />
        <BaseEmail.SectionLabel>
          {m.email_account_welcome_tips_title({}, { locale })}
        </BaseEmail.SectionLabel>
        <BaseEmail.TextBlock>{m.email_account_welcome_tip_1({}, { locale })}</BaseEmail.TextBlock>
        <BaseEmail.TextBlock>{m.email_account_welcome_tip_2({}, { locale })}</BaseEmail.TextBlock>
        <BaseEmail.TextBlock>{m.email_account_welcome_tip_3({}, { locale })}</BaseEmail.TextBlock>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_account_welcome_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
