import { useMutation } from "@tanstack/react-query";
import { m } from "~/paraglide/messages";
import { useAuthContext } from "@/hooks/use-auth-context";
import { useResendCooldown } from "./use-resend-cooldown";

export interface UseResendVerificationResult {
  resend: () => Promise<void>;
  reset: () => void;
  isPending: boolean;
  isCoolingDown: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function useResendVerification(email: string): UseResendVerificationResult {
  const { sendVerificationEmail } = useAuthContext();
  const cooldown = useResendCooldown();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error(m.auth_error_email_missing());
      await sendVerificationEmail(email);
    },
    onSuccess: () => {
      cooldown.start();
    },
  });

  return {
    resend: async () => {
      await mutation.mutateAsync().catch(() => undefined);
    },
    reset: mutation.reset,
    isPending: mutation.isPending,
    isCoolingDown: cooldown.isCoolingDown,
    isSuccess: mutation.isSuccess,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
