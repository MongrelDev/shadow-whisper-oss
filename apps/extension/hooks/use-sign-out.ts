import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient } from "~/lib/auth-client";
import { removeToken } from "~/lib/token-storage";
import { m } from "~/paraglide/messages";

export function useSignOut() {
  const routerInstance = useRouter();

  async function signOut() {
    try {
      await authClient.signOut();
    } catch {
      toast.error(m.settings_account_sign_out_error());
    } finally {
      await removeToken();
      void routerInstance.navigate({ to: "/login" });
    }
  }

  return { signOut };
}
