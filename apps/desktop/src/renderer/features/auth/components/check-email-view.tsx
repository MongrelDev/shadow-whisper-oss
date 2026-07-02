import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Mail, RefreshCw } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CheckEmailViewProps {
  email: string;
  resendLabel: string;
  resendDisabled: boolean;
  onResend: () => void;
  verifyLabel: string;
  verifyDisabled: boolean;
  onVerify: () => void;
  statusMessage?: { kind: "info" | "success" | "error"; text: string } | null;
}

type StatusMessage = NonNullable<CheckEmailViewProps["statusMessage"]>;

export function CheckEmailView({
  email,
  resendLabel,
  resendDisabled,
  onResend,
  verifyLabel,
  verifyDisabled,
  onVerify,
  statusMessage,
}: CheckEmailViewProps): React.ReactElement {
  return (
    <div className="w-full space-y-8">
      <ConfirmationBeacon />
      <EmailDestination email={email} />
      <StatusNote message={statusMessage} />
      <VerificationActions
        resendLabel={resendLabel}
        resendDisabled={resendDisabled}
        onResend={onResend}
        verifyLabel={verifyLabel}
        verifyDisabled={verifyDisabled}
        onVerify={onVerify}
      />
      <DeliveryHint />
      <PathDivider />
      <LoginShortcut email={email} />
    </div>
  );
}

function ConfirmationBeacon(): React.ReactElement {
  return (
    <div className="flex justify-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Mail className="size-6" aria-hidden="true" />
      </div>
    </div>
  );
}

function EmailDestination({ email }: Pick<CheckEmailViewProps, "email">): React.ReactElement {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">
        {m.auth_check_email_title()}
      </h1>
      <p className="text-muted-foreground">{m.auth_check_email_sent_to()}</p>
      <p className="font-mono text-sm text-foreground">
        {email || m.auth_check_email_fallback_address()}
      </p>
    </div>
  );
}

function StatusNote({ message }: { message?: StatusMessage | null }): React.ReactElement | null {
  if (!message) return null;

  return (
    <div
      role={message.kind === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-4 py-3 text-sm",
        "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-200",
        message.kind === "error"
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-primary/15 bg-primary/5 text-foreground"
      )}
    >
      {message.kind === "success" && (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      )}
      <p>{message.text}</p>
    </div>
  );
}

function VerificationActions({
  resendLabel,
  resendDisabled,
  onResend,
  verifyLabel,
  verifyDisabled,
  onVerify,
}: Pick<
  CheckEmailViewProps,
  "resendLabel" | "resendDisabled" | "onResend" | "verifyLabel" | "verifyDisabled" | "onVerify"
>): React.ReactElement {
  return (
    <div className="space-y-3">
      <VerifyButton label={verifyLabel} disabled={verifyDisabled} onClick={onVerify} />
      <ResendButton label={resendLabel} disabled={resendDisabled} onClick={onResend} />
    </div>
  );
}

function VerifyButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <Button type="button" size="lg" className="w-full gap-2" onClick={onClick} disabled={disabled}>
      <CheckCircle2 className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

function ResendButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}): React.ReactElement {
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full gap-2"
      onClick={onClick}
      disabled={disabled}
    >
      <RefreshCw className="size-4" aria-hidden="true" />
      {label}
    </Button>
  );
}

function DeliveryHint(): React.ReactElement {
  return (
    <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4 text-xs leading-[1.65] text-muted-foreground">
      <p>{m.auth_check_email_delivery_hint()}</p>
    </div>
  );
}

function PathDivider(): React.ReactElement {
  return (
    <div className="flex items-center gap-4">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{m.auth_divider_or()}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function LoginShortcut({ email }: Pick<CheckEmailViewProps, "email">): React.ReactElement {
  return (
    <p className="text-center text-sm text-muted-foreground">
      {m.auth_check_email_login_prompt()}{" "}
      <Link
        to="/auth/login"
        search={{ email, verified: "success" }}
        className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline"
      >
        {m.auth_check_email_login_link()}
        <ArrowRight className="size-3" aria-hidden="true" />
      </Link>
    </p>
  );
}
