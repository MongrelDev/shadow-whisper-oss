import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface UsageThresholdEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly percentage: string;
  readonly used: string;
  readonly total: string;
  readonly unit: string;
  readonly resetDate: string;
  readonly upgradeUrl: string;
  readonly appBaseUrl: string;
}

export function UsageThresholdEmail({
  locale,
  firstName,
  percentage,
  used,
  total,
  unit,
  resetDate,
  upgradeUrl,
  appBaseUrl,
}: UsageThresholdEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_usage_threshold_preview({ firstName, percentage }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>
          {m.email_billing_usage_threshold_eyebrow({}, { locale })}
        </BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_usage_threshold_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_usage_threshold_heading_muted({}, { locale })}
          accent={m.email_billing_usage_threshold_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>
          {m.email_billing_usage_threshold_lead({ used, total, unit }, { locale })}
        </BaseEmail.Lead>
        <BaseEmail.DetailGroup>
          <BaseEmail.DetailItem
            label={m.email_billing_usage_threshold_detail_used({}, { locale })}
            value={`${used} / ${total} ${unit}`}
            mono
          />
          <BaseEmail.DetailItem
            label={m.email_billing_usage_threshold_detail_resets({}, { locale })}
            value={resetDate}
          />
        </BaseEmail.DetailGroup>
        <BaseEmail.Actions>
          <BaseEmail.Button href={upgradeUrl}>
            {m.email_billing_usage_threshold_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_usage_threshold_outro({}, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
