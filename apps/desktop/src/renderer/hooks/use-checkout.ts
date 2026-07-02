import { useCallback, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

function requireEnv(name: "VITE_WEB_URL"): string {
  const value = import.meta.env[name];
  if (!value || value === "undefined") {
    throw new Error(`Missing ${name}. Defina em apps/desktop/.env e reinicie o electron-vite dev.`);
  }
  return value;
}

const WEB_URL = requireEnv("VITE_WEB_URL");

export type CheckoutOrigin = "onboarding" | "billing";

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

async function fetchCheckoutToken(): Promise<string> {
  const tokenResult = await window.api.auth.createCheckoutStatusToken();
  if (tokenResult.error || !tokenResult.token) {
    throw new CheckoutError(
      tokenResult.error?.message ?? "Unable to create checkout token",
      tokenResult.error?.code
    );
  }
  return tokenResult.token;
}

function buildSuccessUrl(token: string, origin: CheckoutOrigin): string {
  const success = new URL("/purchase/success", WEB_URL);
  success.searchParams.set("token", token);
  success.searchParams.set("from", origin);
  return success.toString();
}

async function createCheckoutUrl(annual: boolean, origin: CheckoutOrigin): Promise<string | null> {
  const token = await fetchCheckoutToken();
  const upgrade = await window.api.auth.subscriptionUpgrade({
    plan: "pro",
    annual,
    successUrl: buildSuccessUrl(token, origin),
    cancelUrl: `${WEB_URL}/purchase/cancelled`,
  });
  if (upgrade.error) throw new CheckoutError(upgrade.error.message, upgrade.error.code);
  return upgrade.url;
}

export function useCheckout(origin: CheckoutOrigin) {
  const [isPolling, setIsPolling] = useState(false);

  const stopPolling = useCallback(() => setIsPolling(false), []);

  const {
    mutate: checkout,
    mutateAsync: checkoutAsync,
    isPending,
  } = useMutation({
    mutationFn: async ({ annual }: { annual: boolean }) => {
      const url = await createCheckoutUrl(annual, origin);
      if (url) {
        window.api.shell.openExternal(url);
        setIsPolling(true);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Falha ao iniciar checkout";
      toast.error(message);
    },
  });

  return { checkout, checkoutAsync, isPending, isPolling, stopPolling };
}
