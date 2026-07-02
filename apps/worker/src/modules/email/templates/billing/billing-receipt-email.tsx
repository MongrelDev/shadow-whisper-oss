import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface BillingReceiptEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly amount: string;
  readonly date: string;
  readonly nextBillingDate: string;
  readonly receiptUrl: string;
  readonly appBaseUrl: string;
}

export function BillingReceiptEmail({
  locale,
  firstName,
  planName,
  amount,
  date,
  nextBillingDate,
  receiptUrl,
  appBaseUrl,
}: BillingReceiptEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_receipt_preview({ firstName, amount }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>{m.email_billing_receipt_eyebrow({}, { locale })}</BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_receipt_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_receipt_heading_muted({}, { locale })}
          accent={m.email_billing_receipt_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>{m.email_billing_receipt_lead({}, { locale })}</BaseEmail.Lead>
        <BaseEmail.DetailGroup>
          <BaseEmail.DetailItem
            label={m.email_billing_detail_amount({}, { locale })}
            value={amount}
            mono
          />
          <BaseEmail.DetailItem
            label={m.email_billing_detail_plan({}, { locale })}
            value={planName}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_receipt_detail_date({}, { locale })}
            value={date}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_detail_next_billing({}, { locale })}
            value={nextBillingDate}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.SecondaryButton href={receiptUrl}>
            {m.email_billing_receipt_cta({}, { locale })}
          </BaseEmail.SecondaryButton>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_receipt_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
