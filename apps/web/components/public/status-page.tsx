import Link from "next/link";
import { AlertTriangle, Check, Clock, FileQuestion, type LucideIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { PublicShell } from "@/components/public/public-shell";
import { cn } from "@/lib/utils";
import { getLocale } from "~/paraglide/runtime";
import { m } from "~/paraglide/messages";

type StatusTone = "success" | "error" | "loading" | "not-found";

const toneVisual: Record<StatusTone, { icon: LucideIcon; iconClassName: string }> = {
  success: { icon: Check, iconClassName: "bg-primary text-primary-foreground" },
  error: { icon: AlertTriangle, iconClassName: "bg-destructive text-destructive-foreground" },
  loading: { icon: Clock, iconClassName: "bg-secondary text-secondary-foreground" },
  "not-found": { icon: FileQuestion, iconClassName: "bg-muted text-muted-foreground" },
};

interface StatusPageProps {
  tone: StatusTone;
  title: string;
  description: string;
  details?: Array<{ label: string; value: string }>;
  primaryAction?: {
    href: string;
    label: string;
  };
  secondaryAction?: {
    href: string;
    label: string;
  };
  currentPath: string;
}

function StatusAction({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className: string;
}): React.ReactElement {
  if (href.startsWith("mailto:") || href.startsWith("http")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function getToneLabel(tone: StatusTone): string {
  if (tone === "not-found") {
    return getLocale() === "pt-BR" ? "Página não encontrada" : "Page not found";
  }

  const toneLabels: Record<"success" | "error" | "loading", string> = {
    success: m.status_tone_success(),
    error: m.status_tone_error(),
    loading: m.status_tone_loading(),
  };

  return toneLabels[tone];
}

function StatusDetails({
  details,
}: {
  details: Array<{ label: string; value: string }>;
}): React.ReactElement | null {
  if (details.length === 0) {
    return null;
  }

  return (
    <dl className="mt-8 grid gap-3 sm:grid-cols-2">
      {details.map((item) => (
        <div key={item.label} className="rounded-md border border-border bg-background/75 p-4">
          <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm font-medium text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function StatusActions({
  primaryAction,
  secondaryAction,
}: {
  primaryAction: { href: string; label: string };
  secondaryAction?: { href: string; label: string };
}): React.ReactElement {
  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <StatusAction
        href={primaryAction.href}
        label={primaryAction.label}
        className={buttonVariants({ size: "lg" })}
      />
      {secondaryAction ? (
        <StatusAction
          href={secondaryAction.href}
          label={secondaryAction.label}
          className={buttonVariants({ variant: "outline", size: "lg" })}
        />
      ) : null}
    </div>
  );
}

export function StatusPage({
  tone,
  title,
  description,
  details = [],
  primaryAction,
  secondaryAction,
  currentPath,
}: StatusPageProps): React.ReactElement {
  const visual = toneVisual[tone];
  const Icon = visual.icon;
  const toneLabel = getToneLabel(tone);
  const resolvedPrimaryAction = primaryAction ?? { href: "/", label: m.status_back_home() };

  return (
    <PublicShell eyebrow={toneLabel} currentPath={currentPath}>
      <div className="flex flex-1 items-center py-20" role="status">
        <div className="w-full max-w-2xl">
          <div
            className={cn(
              "mb-6 flex size-12 items-center justify-center rounded-md",
              visual.iconClassName
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </div>
          <h1 className="max-w-xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
            {description}
          </p>

          <StatusDetails details={details} />
          <StatusActions primaryAction={resolvedPrimaryAction} secondaryAction={secondaryAction} />
        </div>
      </div>
    </PublicShell>
  );
}

export function LoadingState({ currentPath }: { currentPath: string }): React.ReactElement {
  return (
    <StatusPage
      tone="loading"
      title={m.status_loading_title()}
      description={m.status_loading_description()}
      currentPath={currentPath}
    />
  );
}
