import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

export function useBillingPortal() {
  const mutation = useMutation({
    mutationFn: async () => {
      const result = await authClient.subscription.billingPortal({
        returnUrl: import.meta.env.VITE_WEB_URL,
        disableRedirect: true,
      });

      if (result.error) {
        const message =
          result.error.status === 403
            ? m.settings_billing_no_subscription()
            : (result.error.message ?? m.settings_billing_error());
        throw new Error(message);
      }

      const url = result.data?.url;
      if (!url) {
        throw new Error(m.settings_billing_error());
      }

      return url;
    },
    onSuccess: (url) => {
      if (typeof chrome !== "undefined" && chrome.tabs) {
        chrome.tabs.create({ url, active: true });
      } else {
        window.open(url, "_blank");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    openPortal: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}
