import { useCallback, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "~/lib/api-client";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

export type CheckoutOrigin = "home" | "settings" | "paywall";

const WEB_URL = import.meta.env.VITE_WEB_URL as string;

async function fetchCheckoutToken(): Promise<string> {
  const res = await apiClient.billing["checkout-token"].$post();
  if (!res.ok) {
    throw new Error(`Failed to create checkout token (${res.status})`);
  }
  const { token } = await res.json();
  return token;
}

function buildSuccessUrl(token: string): string {
  const success = new URL("/purchase/success", WEB_URL);
  success.searchParams.set("token", token);
  success.searchParams.set("from", "extension");
  return success.toString();
}

async function createCheckoutUrl(annual: boolean): Promise<string | null> {
  const token = await fetchCheckoutToken();
  const result = await authClient.subscription.upgrade({
    plan: "pro",
    annual,
    successUrl: buildSuccessUrl(token),
    cancelUrl: `${WEB_URL}/purchase/cancelled`,
    disableRedirect: true,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Failed to create checkout session");
  }

  return result.data?.url ?? null;
}

function openCheckoutTab(url: string): void {
  if (typeof chrome !== "undefined" && chrome.tabs) {
    chrome.tabs.create({ url, active: true });
  } else {
    window.open(url, "_blank");
  }
}

async function persistCheckoutInProgress(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    await chrome.storage.session.set({ checkoutInProgress: true });
  }
}

async function clearCheckoutInProgress(): Promise<void> {
  if (typeof chrome !== "undefined" && chrome.storage?.session) {
    await chrome.storage.session.remove("checkoutInProgress");
  }
}

export function useCheckout(origin: CheckoutOrigin) {
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.storage?.session) return;
    chrome.storage.session.get("checkoutInProgress").then((result) => {
      if (result.checkoutInProgress === true) {
        setIsPolling(true);
      }
    });
  }, []);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
    clearCheckoutInProgress();
  }, []);

  const mutation = useMutation({
    mutationFn: ({ annual }: { annual: boolean }) => createCheckoutUrl(annual),
    onSuccess: async (url) => {
      if (!url) return;
      openCheckoutTab(url);
      await persistCheckoutInProgress();
      setIsPolling(true);
    },
    onError: () => {
      toast.error(m.billing_checkout_error());
    },
  });

  return {
    checkout: (args: { annual: boolean }) => mutation.mutate(args),
    isPending: mutation.isPending,
    isPolling,
    stopPolling,
    origin,
  };
}
