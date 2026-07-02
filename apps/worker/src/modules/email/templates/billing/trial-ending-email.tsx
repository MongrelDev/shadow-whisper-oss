import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface TrialEndingEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly amount: string;
  readonly endDate: string;
  readonly cardLast4: string;
  readonly manageUrl: string;
  readonly appBaseUrl: string;
}

export function TrialEndingEmail({
  locale,
  firstName,
  planName,
  amount,
  endDate,
  cardLast4,
  manageUrl,
  appBaseUrl,
}: TrialEndingEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_trial_ending_preview({ firstName, endDate }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_billing_trial_ending_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_trial_ending_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_trial_ending_heading_muted({}, { locale })}
          accent={m.email_billing_trial_ending_heading_accent({ endDate }, { locale })}
        />
        <BaseEmail.Lead>
          {m.email_billing_trial_ending_lead({ amount, cardLast4, endDate }, { locale })}
        </BaseEmail.Lead>
        <BaseEmail.DetailGroup>
          <BaseEmail.DetailItem
            label={m.email_billing_detail_plan({}, { locale })}
            value={planName}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_detail_amount({}, { locale })}
            value={amount}
            mono
          />
          <BaseEmail.DetailItem
            label={m.email_billing_trial_ending_detail_billing_starts({}, { locale })}
            value={endDate}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_detail_card({}, { locale })}
            value={m.email_billing_detail_card_value({ cardLast4 }, { locale })}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.Button href={manageUrl}>
            {m.email_billing_trial_ending_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_trial_ending_outro({ endDate }, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
