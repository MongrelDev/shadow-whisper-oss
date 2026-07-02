"use client";

import { useCallback, useEffect, useRef } from "react";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

import { cn } from "@/lib/utils";

import { AUTO_LANGUAGE_CODE, GUEST_LANGUAGES, findLanguage, type GuestLanguage } from "./languages";

interface LanguageStripProps {
  value: string;
  onChange: (code: string) => void;
  locale: Locale;
}

interface PillProps {
  selected: boolean;
  onClick: () => void;
  label: string;
  flag?: string;
  icon?: React.ReactNode;
  ariaLabel?: string;
}

function Pill({ selected, onClick, label, flag, icon, ariaLabel }: PillProps): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={ariaLabel ?? label}
      className={cn(
        "inline-flex h-9 shrink-0 select-none items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors",
        selected
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-card text-card-foreground hover:bg-accent"
      )}
    >
      {icon ? (
        <span className="inline-flex size-4 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
      ) : (
        <span className="text-base leading-none" aria-hidden="true">
          {flag}
        </span>
      )}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function GlobeIcon(): React.ReactElement {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18" />
    </svg>
  );
}

function useDragScroll(): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let pointerId: number | null = null;
    let startX = 0;
    let startScroll = 0;
    let dragged = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pointerId = event.pointerId;
      startX = event.clientX;
      startScroll = el.scrollLeft;
      dragged = false;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      const dx = event.clientX - startX;
      if (!dragged && Math.abs(dx) > 4) {
        dragged = true;
        el.setPointerCapture(event.pointerId);
        el.style.cursor = "grabbing";
      }
      if (dragged) {
        el.scrollLeft = startScroll - dx;
        event.preventDefault();
      }
    };
    const endDrag = (event: PointerEvent) => {
      if (pointerId !== event.pointerId) return;
      if (dragged) {
        try {
          el.releasePointerCapture(event.pointerId);
        } catch {
          /* noop */
        }
        el.style.cursor = "";
      }
      pointerId = null;
    };
    const onClickCapture = (event: MouseEvent) => {
      if (dragged) {
        event.stopPropagation();
        event.preventDefault();
        dragged = false;
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);
    el.addEventListener("click", onClickCapture, true);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", endDrag);
      el.removeEventListener("pointercancel", endDrag);
      el.removeEventListener("click", onClickCapture, true);
    };
  }, []);

  return ref;
}

function PinnedSlot({
  value,
  onChange,
  locale,
}: {
  value: string;
  onChange: (code: string) => void;
  locale: Locale;
}): React.ReactElement {
  const isAuto = value === AUTO_LANGUAGE_CODE;
  const lang = isAuto ? null : findLanguage(value);
  const autoLabel = m.home_demo_language_auto({}, { locale });

  if (isAuto || !lang) {
    return (
      <Pill
        selected
        onClick={() => onChange(AUTO_LANGUAGE_CODE)}
        label={autoLabel}
        icon={<GlobeIcon />}
      />
    );
  }
  return (
    <Pill
      selected
      onClick={() => onChange(lang.code)}
      flag={lang.flag}
      label={lang.label}
      ariaLabel={lang.label}
    />
  );
}

function LanguageList({
  value,
  onChange,
  locale,
  scrollRef,
}: {
  value: string;
  onChange: (code: string) => void;
  locale: Locale;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}): React.ReactElement {
  const autoLabel = m.home_demo_language_auto({}, { locale });
  const items: Array<GuestLanguage | "auto"> = [
    "auto",
    ...GUEST_LANGUAGES.filter((l) => l.code !== value),
  ];

  return (
    <div
      ref={scrollRef}
      role="listbox"
      aria-label={m.home_demo_language_label({}, { locale })}
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        "touch-pan-x cursor-grab"
      )}
    >
      {items.map((item) => {
        if (item === "auto") {
          if (value === AUTO_LANGUAGE_CODE) return null;
          return (
            <Pill
              key="auto"
              selected={false}
              onClick={() => onChange(AUTO_LANGUAGE_CODE)}
              label={autoLabel}
              icon={<GlobeIcon />}
            />
          );
        }
        return (
          <Pill
            key={item.code}
            selected={false}
            onClick={() => onChange(item.code)}
            flag={item.flag}
            label={item.label}
            ariaLabel={item.label}
          />
        );
      })}
    </div>
  );
}

export function LanguageStrip({ value, onChange, locale }: LanguageStripProps): React.ReactElement {
  const scrollRef = useDragScroll();

  const handleChange = useCallback(
    (code: string) => {
      onChange(code);
    },
    [onChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-start gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          {m.home_demo_language_label({}, { locale })}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {m.home_demo_language_hint({}, { locale })}
        </p>
      </div>
      <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-border bg-background/50 p-1.5 sm:flex-row sm:items-center sm:gap-3 sm:rounded-full">
        <div className="shrink-0 self-start">
          <PinnedSlot value={value} onChange={handleChange} locale={locale} />
        </div>
        <span aria-hidden="true" className="hidden h-6 w-px shrink-0 bg-border sm:block" />
        <LanguageList value={value} onChange={handleChange} locale={locale} scrollRef={scrollRef} />
      </div>
    </div>
  );
}
