import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface SubscriptionCancelledEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly accessEndDate: string;
  readonly resubscribeUrl: string;
  readonly appBaseUrl: string;
}

export function SubscriptionCancelledEmail({
  locale,
  firstName,
  planName,
  accessEndDate,
  resubscribeUrl,
  appBaseUrl,
}: SubscriptionCancelledEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_sub_cancelled_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_billing_sub_cancelled_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_sub_cancelled_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_sub_cancelled_heading_muted({}, { locale })}
          accent={m.email_billing_sub_cancelled_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>
          {m.email_billing_sub_cancelled_lead({ planName, accessEndDate }, { locale })}
        </BaseEmail.Lead>
        <BaseEmail.DetailGroup>
          <BaseEmail.DetailItem
            label={m.email_billing_sub_cancelled_detail_access_until({}, { locale })}
            value={accessEndDate}
          />
          <BaseEmail.DetailItem
            label={m.email_billing_sub_cancelled_detail_reverts_to({}, { locale })}
            value={m.email_billing_sub_cancelled_detail_free_plan({}, { locale })}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.SecondaryButton href={resubscribeUrl}>
            {m.email_billing_sub_cancelled_cta({}, { locale })}
          </BaseEmail.SecondaryButton>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_sub_cancelled_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
