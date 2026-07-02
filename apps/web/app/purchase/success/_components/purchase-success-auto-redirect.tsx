"use client";

import { useEffect, useState } from "react";
import { m } from "~/paraglide/messages";

interface Props {
  token?: string;
  from?: string;
}

const DEEP_LINK_PROTOCOL = "com.shadowwhisper.app://purchase/success";

export function PurchaseSuccessAutoRedirect({ token, from }: Props): React.ReactElement | null {
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    if (!token) return;
    if (from === "extension") return;
    const timer = setTimeout(() => {
      setIsRedirecting(false);
      const deepLink = new URL(DEEP_LINK_PROTOCOL);
      deepLink.searchParams.set("token", token);
      if (from) deepLink.searchParams.set("from", from);
      window.location.href = deepLink.toString();
    }, 600);
    return () => clearTimeout(timer);
  }, [token, from]);

  if (!token) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="mt-8 flex items-center gap-3 rounded-lg border border-border/60 bg-background/50 p-4"
    >
      <CheckMark />
      <div>
        <p className="text-sm text-muted-foreground">{m.purchase_success_redirect_message()}</p>
        {isRedirecting && (
          <p className="mt-1 text-xs text-muted-foreground/60">
            {m.purchase_success_redirecting()}
          </p>
        )}
      </div>
    </div>
  );
}

function CheckMark(): React.ReactElement {
  return (
    <span
      aria-hidden="true"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}
