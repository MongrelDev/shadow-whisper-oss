export type EmailTemplateKind =
  | "auth-verification"
  | "auth-password-reset"
  | "account-welcome"
  | "account-password-changed"
  | "billing-trial-ending"
  | "billing-subscription-confirmed"
  | "billing-subscription-cancelled"
  | "billing-receipt"
  | "billing-payment-failed"
  | "billing-usage-threshold"
  | "billing-plan-limit-reached";

export interface RenderedEmailTemplate {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
  readonly headerType: EmailTemplateKind;
}
