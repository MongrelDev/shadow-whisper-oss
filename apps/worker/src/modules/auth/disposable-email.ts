import MailChecker from "mailchecker";

export function isDisposableEmail(email: string): boolean {
  return !MailChecker.isValid(email);
}
