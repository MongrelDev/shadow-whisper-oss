"use client";

import type { VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ButtonVariants = VariantProps<typeof buttonVariants>;

interface SignUpCtaProps {
  href?: string;
  variant?: ButtonVariants["variant"];
  size?: ButtonVariants["size"];
  className?: string;
  children: React.ReactNode;
  pendingLabel?: string;
}

export function SignUpCta({
  href = "/sign-up",
  variant,
  size,
  className,
  children,
  pendingLabel = "Abrindo",
}: SignUpCtaProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => router.push(href))}
      className={cn(buttonVariants({ variant, size }), className)}
    >
      {isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
