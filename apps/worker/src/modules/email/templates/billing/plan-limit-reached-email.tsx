import { m } from "../../../../paraglide/messages.js";
import type { EmailLocale } from "../../domain/email-locale";
import { BaseEmail } from "../layouts/base-email";

export interface PlanLimitReachedEmailProps {
  readonly locale: EmailLocale;
  readonly firstName: string;
  readonly planName: string;
  readonly total: string;
  readonly unit: string;
  readonly resetDate: string;
  readonly upgradeUrl: string;
  readonly appBaseUrl: string;
}

export function PlanLimitReachedEmail({
  locale,
  firstName,
  planName,
  total,
  unit,
  resetDate,
  upgradeUrl,
  appBaseUrl,
}: PlanLimitReachedEmailProps) {
  return (
    <BaseEmail.Root
      lang={locale}
      preview={m.email_billing_plan_limit_preview({ firstName }, { locale })}
    >
      <BaseEmail.Card>
        <BaseEmail.Brand href={appBaseUrl} />
        <BaseEmail.Eyebrow>{m.email_billing_plan_limit_eyebrow({}, { locale })}</BaseEmail.Eyebrow>
        <BaseEmail.SplitHeading
          intro={m.email_billing_plan_limit_heading_intro({ firstName }, { locale })}
          muted={m.email_billing_plan_limit_heading_muted({}, { locale })}
          accent={m.email_billing_plan_limit_heading_accent({}, { locale })}
        />
        <BaseEmail.Lead>
          {m.email_billing_plan_limit_lead({ total, unit, planName, resetDate }, { locale })}
        </BaseEmail.Lead>
        <BaseEmail.Actions>
          <BaseEmail.Button href={upgradeUrl}>
            {m.email_billing_plan_limit_cta({}, { locale })}
          </BaseEmail.Button>
        </BaseEmail.Actions>
        <BaseEmail.Footer appBaseUrl={appBaseUrl}>
          {m.email_billing_plan_limit_outro({ resetDate }, { locale })}
        </BaseEmail.Footer>
      </BaseEmail.Card>
    </BaseEmail.Root>
  );
}
