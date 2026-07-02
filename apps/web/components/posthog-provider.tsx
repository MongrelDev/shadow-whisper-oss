"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

let hasInitializedPostHog = false;
let lastCapturedUrl: string | null = null;
let posthogPromise: Promise<typeof import("posthog-js").default> | null = null;

const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN?.trim();
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://us.i.posthog.com";

function loadPostHog(): Promise<typeof import("posthog-js").default> {
  posthogPromise ??= import("posthog-js").then(({ default: posthog }) => {
    if (!hasInitializedPostHog) {
      posthog.init(posthogKey ?? "", {
        api_host: posthogHost,
        capture_pageview: false,
        capture_pageleave: true,
        autocapture: true,
      });
      hasInitializedPostHog = true;
    }

    return posthog;
  });

  return posthogPromise;
}

export function PostHogProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  useEffect(() => {
    if (!posthogKey) {
      return;
    }

    const currentUrl = window.location.href;
    if (lastCapturedUrl === currentUrl) {
      return;
    }

    lastCapturedUrl = currentUrl;

    void loadPostHog().then((posthog) => {
      posthog.capture("$pageview", {
        $current_url: currentUrl,
        pathname,
      });
    });
  }, [pathname, search]);

  return <>{children}</>;
}
