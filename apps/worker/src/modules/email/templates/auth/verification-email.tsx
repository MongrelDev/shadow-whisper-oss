import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface VerificationEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly verificationUrl: string;
  readonly appBaseUrl: string;
}

export function VerificationEmail({
  locale,
  firstName,
  verificationUrl,
  appBaseUrl,
}: VerificationEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_auth_verification_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>{m.email_auth_verification_eyebrow({}, { locale })}</BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_auth_verification_heading_intro({ firstName }, { locale })}
          muted={m.email_auth_verification_heading_muted({}, { locale })}
          accent={m.email_auth_verification_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>{m.email_auth_verification_lead({}, { locale })}</BaseEmail.Lead>
        <BaseEmail.Actions>
          <BaseEmail.Button href={verificationUrl}>
            {m.email_auth_verification_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Divider />
        <BaseEmail.SectionLabel>
          {m.email_auth_verification_link_title({}, { locale })}
        </BaseEmail.SectionLabel>
        <BaseEmail.TextBlock>
          {m.email_auth_verification_link_intro({}, { locale })}
        </BaseEmail.TextBlock>
        <BaseEmail.MonoText>{verificationUrl}</BaseEmail.MonoText>
        <BaseEmail.Divider />
        <BaseEmail.SectionLabel>
          {m.email_auth_verification_step_title({}, { locale })}
        </BaseEmail.SectionLabel>
        <BaseEmail.Text>
          {m.email_auth_verification_step_before_action({}, { locale })}
          <strong>{m.email_auth_verification_step_action({}, { locale })}</strong>
          {m.email_auth_verification_step_after_action({}, { locale })}
        </BaseEmail.Text>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_auth_verification_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
