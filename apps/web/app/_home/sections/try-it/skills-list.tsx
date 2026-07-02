"use client";

import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { cn } from "@/lib/utils";

import type { GuestTransformer } from "./use-guest-skills";

interface SkillsListProps {
  transformers: GuestTransformer[];
  loading: boolean;
  errorMessage: string | null;
  skillId: string;
  onPick: (id: string) => void;
  locale: Locale;
}

function PolishIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3z" />
      <path d="M18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15z" />
    </svg>
  );
}

function TranslateIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 5h10" />
      <path d="M9 3v2c0 5-3 8-6 9" />
      <path d="M5 10c0 3 4 5 7 5" />
      <path d="M14 20l4-11 4 11" />
      <path d="M15 17h6" />
    </svg>
  );
}

function EmailIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}

function SparkIcon(): React.ReactElement {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 17l4-9 4 9" />
      <path d="M5 14h6" />
      <path d="M14 8h6" />
      <path d="M14 13h4" />
      <path d="M14 18h5" />
    </svg>
  );
}

function iconFor(id: string): React.ReactElement {
  if (id.includes("cleanup")) return <PolishIcon />;
  if (id.includes("english") || id.includes("translate")) return <TranslateIcon />;
  if (id.includes("email")) return <EmailIcon />;
  return <SparkIcon />;
}

function SkillRow({
  transformer,
  selected,
  onPick,
}: {
  transformer: GuestTransformer;
  selected: boolean;
  onPick: (id: string) => void;
}): React.ReactElement {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-lg border px-2.5 py-2.5 transition-colors sm:gap-3 sm:px-3 sm:py-3",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-foreground/30"
      )}
    >
      <span
        className={cn(
          "mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md",
          selected ? "text-primary" : "text-muted-foreground"
        )}
        aria-hidden="true"
      >
        <span className="h-4 w-4">{iconFor(transformer.id)}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium text-foreground">{transformer.label}</span>
        <span className="text-xs leading-5 text-muted-foreground">{transformer.description}</span>
      </span>
      <input
        type="radio"
        name="skill"
        value={transformer.id}
        checked={selected}
        onChange={() => onPick(transformer.id)}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 h-4 w-4 flex-shrink-0 rounded-full border-2 transition-colors",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40 bg-transparent"
        )}
      />
    </label>
  );
}

export function SkillsList({
  transformers,
  loading,
  errorMessage,
  skillId,
  onPick,
  locale,
}: SkillsListProps): React.ReactElement {
  return (
    <div>
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {m.home_demo_skills_label({}, { locale })}
      </p>
      {errorMessage ? (
        <p role="alert" className="text-xs text-destructive">
          {m.home_demo_error_skills_load({}, { locale })}
        </p>
      ) : null}
      {loading && transformers.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          {m.home_demo_loading_skills({}, { locale })}
        </p>
      ) : null}
      <div role="radiogroup" aria-label="Skill" className="flex flex-col gap-2">
        {transformers.map((t) => (
          <SkillRow key={t.id} transformer={t} selected={t.id === skillId} onPick={onPick} />
        ))}
      </div>
    </div>
  );
}
