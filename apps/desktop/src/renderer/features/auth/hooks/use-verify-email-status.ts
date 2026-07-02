import { useMutation } from "@tanstack/react-query";
import { m } from "~/paraglide/messages";
import { useAuthContext } from "@/hooks/use-auth-context";

export interface UseVerifyEmailStatusResult {
  verify: () => Promise<void>;
  reset: () => void;
  isPending: boolean;
  isVerified: boolean;
  isUnverified: boolean;
  error: string | null;
}

export function useVerifyEmailStatus(email: string): UseVerifyEmailStatusResult {
  const { checkEmailStatus } = useAuthContext();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!email) throw new Error(m.auth_error_email_missing());
      return checkEmailStatus(email);
    },
  });

  return {
    verify: async () => {
      await mutation.mutateAsync().catch(() => undefined);
    },
    reset: mutation.reset,
    isPending: mutation.isPending,
    isVerified: mutation.data === true,
    isUnverified: mutation.data === false,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}
