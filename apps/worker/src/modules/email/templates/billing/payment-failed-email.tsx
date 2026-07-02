import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface PaymentFailedEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly amount: string;
  readonly cardLast4: string;
  readonly nextRetryDate: string;
  readonly updatePaymentUrl: string;
  readonly appBaseUrl: string;
}

export function PaymentFailedEmail({
  locale,
  firstName,
  planName,
  amount,
  cardLast4,
  nextRetryDate,
  updatePaymentUrl,
  appBaseUrl,
}: PaymentFailedEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_payment_failed_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_billing_payment_failed_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_payment_failed_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_payment_failed_heading_muted({}, { locale })}
          accent={m.email_billing_payment_failed_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>
          {m.email_billing_payment_failed_lead({ cardLast4, planName }, { locale })}
        </BaseEmail.Lead>
        <BaseEmail.DetailGroup>
          <BaseEmail.DetailItem
            label={m.email_billing_detail_amount({}, { locale })}
            value={amount}
            mono
          />
          <BaseEmail.DetailItem
            label={m.email_billing_detail_card({}, { locale })}
            value={m.email_billing_detail_card_value({ cardLast4 }, { locale })}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_payment_failed_detail_retry({}, { locale })}
            value={nextRetryDate}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.Button href={updatePaymentUrl}>
            {m.email_billing_payment_failed_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_payment_failed_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
