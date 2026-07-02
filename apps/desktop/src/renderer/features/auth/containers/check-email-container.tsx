import { useEffect } from "react";
import { m } from "~/paraglide/messages";
import { CheckEmailView } from "../components/check-email-view";
import { useResendVerification } from "../hooks/use-resend-verification";
import { useVerifyEmailStatus } from "../hooks/use-verify-email-status";

interface CheckEmailContainerProps {
  email: string;
  onVerified: (email: string) => void;
}

type StatusMessage = { kind: "info" | "success" | "error"; text: string };

function composeStatus(
  resend: ReturnType<typeof useResendVerification>,
  verify: ReturnType<typeof useVerifyEmailStatus>
): StatusMessage | null {
  if (resend.error) return { kind: "error", text: resend.error };
  if (verify.error) return { kind: "error", text: verify.error };
  if (verify.isUnverified) {
    return {
      kind: "info",
      text: m.auth_check_email_info_unverified(),
    };
  }
  if (resend.isSuccess) {
    return { kind: "success", text: m.auth_check_email_success_resent() };
  }
  return null;
}

export function CheckEmailContainer({
  email,
  onVerified,
}: CheckEmailContainerProps): React.ReactElement {
  const resend = useResendVerification(email);
  const verify = useVerifyEmailStatus(email);

  useEffect(() => {
    if (!verify.isVerified) return;
    onVerified(email);
  }, [verify.isVerified, email, onVerified]);

  return (
    <CheckEmailView
      email={email}
      resendLabel={m.auth_check_email_resend()}
      resendDisabled={resend.isCoolingDown || resend.isPending}
      onResend={() => {
        resend.reset();
        verify.reset();
        void resend.resend();
      }}
      verifyLabel={m.auth_check_email_verify()}
      verifyDisabled={verify.isPending}
      onVerify={() => {
        resend.reset();
        verify.reset();
        void verify.verify();
      }}
      statusMessage={composeStatus(resend, verify)}
    />
  );
}
