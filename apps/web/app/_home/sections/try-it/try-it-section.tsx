"use client";

import { useState } from "react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { cn } from "@/lib/utils";
import { QueryProvider } from "@/components/query-provider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { LanguageStrip } from "./language-strip";
import { RecordPillButton } from "./record-pill-button";
import { TranscriptPanel } from "./transcript-panel";
import { SkillsList } from "./skills-list";
import { TryItOverlay } from "./try-it-overlay";
import { useGuestFlow, type UseGuestFlowResult } from "./use-guest-flow";
import type { GuestTransformer } from "./use-guest-skills";

interface TryItSectionProps {
  locale: Locale;
}

function SectionHeader({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <div className="mb-6 sm:mb-10 max-w-3xl">
      <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        {m.home_demo_kicker({}, { locale })}
      </p>
      <h2 className="mt-4 text-[clamp(2rem,4.2vw,3rem)] font-semibold leading-[1.05] tracking-[-0.025em] text-balance">
        {m.home_demo_title({}, { locale })}
      </h2>
      <p className="mt-5 max-w-[58ch] text-base leading-[1.7] text-muted-foreground">
        {m.home_demo_subtitle({}, { locale })}
      </p>
    </div>
  );
}

function ApplyRow({
  skillLabel,
  hasText,
  applying,
  busy,
  onApply,
  locale,
}: {
  skillLabel: string;
  hasText: boolean;
  applying: boolean;
  busy: boolean;
  onApply: () => void;
  locale: Locale;
}): React.ReactElement {
  return (
    <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <button
        type="button"
        onClick={onApply}
        disabled={!hasText || busy}
        className={cn(
          "inline-flex h-10 min-w-0 max-w-full items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="shrink-0"
        >
          <path d="M5 12l4 4L19 6" />
        </svg>
        {applyButtonText({ applying, skillLabel, locale })}
      </button>
      <span className="min-w-0 text-xs leading-5 text-muted-foreground">
        {applyHint(hasText, locale)}
      </span>
    </div>
  );
}

function applyButtonText({
  applying,
  skillLabel,
  locale,
}: {
  applying: boolean;
  skillLabel: string;
  locale: Locale;
}): React.ReactNode {
  if (applying) return m.home_demo_applying({}, { locale });
  return (
    <span className="truncate">{`${m.home_demo_apply({}, { locale })} ${skillLabel}`.trim()}</span>
  );
}

function applyHint(hasText: boolean, locale: Locale): string {
  if (hasText) return m.home_demo_apply_hint_ready({}, { locale });
  return m.home_demo_apply_hint_empty({}, { locale });
}

function isApplying(phase: UseGuestFlowResult["phase"]): boolean {
  return phase === "applying";
}

function MobileSkillLoading({
  loading,
  transformers,
  locale,
}: {
  loading: boolean;
  transformers: GuestTransformer[];
  locale: Locale;
}): React.ReactElement | null {
  if (!loading || transformers.length > 0) return null;
  return (
    <span className="text-xs text-muted-foreground">
      {m.home_demo_loading_skills({}, { locale })}
    </span>
  );
}

function MobileSkillError({
  errorMessage,
  locale,
}: {
  errorMessage: string | null;
  locale: Locale;
}): React.ReactElement | null {
  if (!errorMessage) return null;
  return (
    <p role="alert" className="mb-2 text-xs text-destructive">
      {m.home_demo_error_skills_load({}, { locale })}
    </p>
  );
}

function findTransformer(
  transformers: GuestTransformer[],
  skillId: string
): GuestTransformer | null {
  return transformers.find((transformer) => transformer.id === skillId) ?? null;
}

function MobileSkillOption({
  transformer,
  selected,
  onPick,
}: {
  transformer: GuestTransformer;
  selected: boolean;
  onPick: (id: string) => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onPick(transformer.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
        "hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        selected ? "bg-primary/5 text-foreground" : "text-foreground"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-1 h-2 w-2 rounded-full border",
          selected ? "border-primary bg-primary" : "border-muted-foreground/40"
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{transformer.label}</span>
        <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
          {transformer.description}
        </span>
      </span>
    </button>
  );
}

function mobileSkillPickerDisabled({
  busy,
  transformers,
}: {
  busy: boolean;
  transformers: GuestTransformer[];
}): boolean {
  return busy || transformers.length === 0;
}

function MobileSkillPicker({
  transformers,
  skillId,
  skillLabel,
  busy,
  onPick,
}: {
  transformers: GuestTransformer[];
  skillId: string;
  skillLabel: string;
  busy: boolean;
  onPick: (id: string) => void;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const disabled = mobileSkillPickerDisabled({ busy, transformers });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id="mobile-demo-skill"
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 text-left text-sm font-medium text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        >
          <span className="min-w-0 truncate">{skillLabel}</span>
          <svg
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="max-h-[min(20rem,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] overflow-y-auto p-1.5"
      >
        <div role="listbox" aria-label="Skill" className="space-y-1">
          {transformers.map((transformer) => (
            <MobileSkillOption
              key={transformer.id}
              transformer={transformer}
              selected={transformer.id === skillId}
              onPick={(id) => {
                onPick(id);
                setOpen(false);
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MobileSkillAction({
  transformers,
  loading,
  errorMessage,
  skillId,
  skillLabel,
  hasText,
  applying,
  busy,
  onPick,
  onApply,
  locale,
}: {
  transformers: GuestTransformer[];
  loading: boolean;
  errorMessage: string | null;
  skillId: string;
  skillLabel: string;
  hasText: boolean;
  applying: boolean;
  busy: boolean;
  onPick: (id: string) => void;
  onApply: () => void;
  locale: Locale;
}): React.ReactElement {
  const selectedTransformer = findTransformer(transformers, skillId);

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {m.home_demo_skills_label({}, { locale })}
        </p>
        <MobileSkillLoading loading={loading} transformers={transformers} locale={locale} />
      </div>

      <MobileSkillError errorMessage={errorMessage} locale={locale} />

      <label className="sr-only" htmlFor="mobile-demo-skill">
        {m.home_demo_skills_label({}, { locale })}
      </label>
      <MobileSkillPicker
        transformers={transformers}
        skillId={skillId}
        skillLabel={skillLabel}
        busy={busy}
        onPick={onPick}
      />
      {selectedTransformer ? (
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {selectedTransformer.description}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onApply}
        disabled={!hasText || busy}
        className={cn(
          "mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        {applyButtonText({ applying, skillLabel, locale })}
      </button>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{applyHint(hasText, locale)}</p>
    </div>
  );
}

function FooterNote({ locale }: { locale: Locale }): React.ReactElement {
  return (
    <p className="mt-auto max-w-[80ch] text-xs leading-6 text-muted-foreground">
      <strong className="font-medium text-foreground">
        {m.home_demo_explainer_title({}, { locale })}
      </strong>{" "}
      {m.home_demo_explainer_body({}, { locale })}
    </p>
  );
}

function OverlaySlot({
  flow,
  locale,
}: {
  flow: UseGuestFlowResult;
  locale: Locale;
}): React.ReactElement | null {
  if (!flow.showOverlay) return null;
  return <TryItOverlay locale={locale} onDismiss={flow.dismissOverlay} />;
}

function FlowError({ error }: { error: string | null }): React.ReactElement | null {
  if (!error) return null;
  return (
    <p role="alert" className="text-xs text-destructive">
      {error}
    </p>
  );
}

function MobileTryItContent({
  flow,
  locale,
}: {
  flow: UseGuestFlowResult;
  locale: Locale;
}): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:hidden">
      <LanguageStrip
        value={flow.spokenLanguage}
        onChange={flow.setSpokenLanguage}
        locale={locale}
      />
      <RecordPillButton
        recording={flow.recording}
        busy={flow.busy}
        elapsedMs={flow.recorder.elapsedMs}
        os={flow.displayedOs}
        locale={locale}
        onToggle={flow.toggleRecord}
        onCancel={flow.cancel}
      />
      <TranscriptPanel
        transcript={flow.transcript}
        recording={flow.recording}
        phase={flow.phase}
        elapsedMs={flow.recorder.elapsedMs}
        skillLabel={flow.skillLabel}
        locale={locale}
        onClear={flow.clear}
        compact
      />
      <MobileSkillAction
        transformers={flow.transformers}
        loading={flow.skillsLoading}
        errorMessage={flow.skillsError}
        skillId={flow.skillId}
        skillLabel={flow.skillLabel}
        hasText={flow.hasText}
        applying={isApplying(flow.phase)}
        busy={flow.busy}
        onPick={flow.setPickedSkillId}
        onApply={flow.applySkill}
        locale={locale}
      />
      <FlowError error={flow.error} />
    </div>
  );
}

function DesktopTryItContent({
  flow,
  locale,
}: {
  flow: UseGuestFlowResult;
  locale: Locale;
}): React.ReactElement {
  return (
    <div className="hidden gap-6 sm:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-stretch lg:gap-8">
      <div className="flex min-w-0 flex-col gap-5">
        <LanguageStrip
          value={flow.spokenLanguage}
          onChange={flow.setSpokenLanguage}
          locale={locale}
        />
        <RecordPillButton
          recording={flow.recording}
          busy={flow.busy}
          elapsedMs={flow.recorder.elapsedMs}
          os={flow.displayedOs}
          locale={locale}
          onToggle={flow.toggleRecord}
          onCancel={flow.cancel}
        />
        <SkillsList
          transformers={flow.transformers}
          loading={flow.skillsLoading}
          errorMessage={flow.skillsError}
          skillId={flow.skillId}
          onPick={flow.setPickedSkillId}
          locale={locale}
        />
        <ApplyRow
          skillLabel={flow.skillLabel}
          hasText={flow.hasText}
          applying={isApplying(flow.phase)}
          busy={flow.busy}
          onApply={flow.applySkill}
          locale={locale}
        />
        <FlowError error={flow.error} />
        <FooterNote locale={locale} />
      </div>
      <div className="flex min-w-0 min-h-[320px] flex-col sm:min-h-[380px] lg:min-h-0">
        <TranscriptPanel
          transcript={flow.transcript}
          recording={flow.recording}
          phase={flow.phase}
          elapsedMs={flow.recorder.elapsedMs}
          skillLabel={flow.skillLabel}
          locale={locale}
          onClear={flow.clear}
        />
      </div>
    </div>
  );
}

function TryItSectionContent({ locale }: TryItSectionProps): React.ReactElement {
  const flow = useGuestFlow(locale);

  return (
    <section
      id="try-it"
      className="border-b border-border/60 bg-muted/20 px-4 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-32"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeader locale={locale} />

        <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-sm sm:p-6 lg:p-8">
          <OverlaySlot flow={flow} locale={locale} />
          <MobileTryItContent flow={flow} locale={locale} />
          <DesktopTryItContent flow={flow} locale={locale} />
        </div>
      </div>
    </section>
  );
}

export function TryItSection({ locale }: TryItSectionProps): React.ReactElement {
  return (
    <QueryProvider>
      <TryItSectionContent locale={locale} />
    </QueryProvider>
  );
}
