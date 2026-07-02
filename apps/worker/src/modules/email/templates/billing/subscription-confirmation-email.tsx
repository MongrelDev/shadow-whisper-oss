import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface SubscriptionConfirmationEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly amount: string;
  readonly nextBillingDate: string;
  readonly appBaseUrl: string;
}

export function SubscriptionConfirmationEmail({
  locale,
  firstName,
  planName,
  amount,
  nextBillingDate,
  appBaseUrl,
}: SubscriptionConfirmationEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_sub_confirmed_preview({ firstName, planName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_billing_sub_confirmed_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_sub_confirmed_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_sub_confirmed_heading_muted({}, { locale })}
          accent={planName}
        />
        <BaseEmail.Lead>{m.email_billing_sub_confirmed_lead({}, { locale })}</BaseEmail.Lead>
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
            label={m.email_billing_detail_next_billing({}, { locale })}
            value={nextBillingDate}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.Button href={appBaseUrl}>
            {m.email_billing_sub_confirmed_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_sub_confirmed_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
