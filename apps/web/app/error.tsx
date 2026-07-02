"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { PublicShell } from "@/components/public/public-shell";
import { Button, buttonVariants } from "@/components/ui/button";
import { m } from "~/paraglide/messages";

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}

export default function ErrorBoundary({
  error,
  unstable_retry,
}: ErrorBoundaryProps): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <PublicShell eyebrow={m.error_page_eyebrow()} currentPath="/">
      <div className="flex flex-1 items-center py-20">
        <div className="w-full max-w-2xl">
          <div className="mb-6 flex size-12 items-center justify-center rounded-md bg-destructive text-destructive-foreground">
            <AlertTriangle className="size-5" aria-hidden="true" />
          </div>
          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {m.error_page_title()}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {m.error_page_description_client()}
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">{error.digest}</p>
          ) : null}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" onClick={unstable_retry}>
              <RotateCcw className="size-4" aria-hidden="true" />
              {m.error_page_retry()}
            </Button>
            <Link href="/" className={buttonVariants({ variant: "outline", size: "lg" })}>
              {m.error_page_back_home()}
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
