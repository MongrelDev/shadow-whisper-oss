"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";
import type { Locale } from "~/paraglide/runtime";

type Platform = "macOS" | "Windows" | "Linux" | "Browser";
type ApiPlatform = "macos" | "windows" | "linux" | "browser";

interface PlatformOption {
  value: Platform;
  logo: string;
  logoAlt: string;
  name: string;
  arch: string;
}

function buildSchema(locale: Locale) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, m.home_waitlist_email_required({}, { locale }))
      .email(m.home_waitlist_email_invalid({}, { locale })),
    platform: z.enum(["macOS", "Windows", "Linux", "Browser"], {
      message: m.home_waitlist_platform_required({}, { locale }),
    }),
  });
}

type WaitlistValues = z.infer<ReturnType<typeof buildSchema>>;

interface WaitlistSubmissionResult {
  success: boolean;
  error?: string;
}

async function parseWaitlistPayload(response: Response) {
  return (await response.json().catch(() => null)) as {
    success?: boolean;
    errors?: Array<{ field?: string; message: string }>;
  } | null;
}

function getWaitlistErrorMessage(
  payload: Awaited<ReturnType<typeof parseWaitlistPayload>>,
  locale: Locale
): string {
  return payload?.errors?.[0]?.message ?? m.er_internal({}, { locale });
}

async function submitWaitlist(
  values: WaitlistValues,
  locale: Locale
): Promise<WaitlistSubmissionResult> {
  const response = await fetch("/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: values.email,
      platform: mapPlatformToApi(values.platform),
    }),
  });

  const payload = await parseWaitlistPayload(response);

  if (response.ok && payload?.success === true) {
    return { success: true };
  }

  return {
    success: false,
    error: getWaitlistErrorMessage(payload, locale),
  };
}

export function WaitlistForm({ locale }: { locale: Locale }): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const schema = useMemo(() => buildSchema(locale), [locale]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", platform: undefined },
  });

  const platforms: PlatformOption[] = [
    {
      value: "macOS",
      logo: "/logos/apple.svg",
      logoAlt: "Apple",
      name: "macOS",
      arch: m.home_waitlist_platform_macos_arch({}, { locale }),
    },
    {
      value: "Windows",
      logo: "/logos/microsoft.svg",
      logoAlt: "Microsoft",
      name: "Windows",
      arch: m.home_waitlist_platform_windows_arch({}, { locale }),
    },
    {
      value: "Linux",
      logo: "/logos/linux.svg",
      logoAlt: "Linux",
      name: "Linux",
      arch: m.home_waitlist_platform_linux_arch({}, { locale }),
    },
    {
      value: "Browser",
      logo: "/logos/browser.svg",
      logoAlt: "Browser",
      name: "Browser",
      arch: m.home_waitlist_platform_browser_arch({}, { locale }),
    },
  ];

  const onSubmit = async (values: WaitlistValues) => {
    setSubmitError(null);
    const result = await submitWaitlist(values, locale);
    if (result.success) {
      setSubmitted(true);
      return;
    }
    setSubmitError(result.error ?? m.er_internal({}, { locale }));
  };

  const handleAgain = () => {
    reset({ email: "", platform: undefined });
    setSubmitted(false);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-[14px] border border-border bg-background">
      <div className="flex items-center justify-between gap-3.5 border-b border-border/60 px-6 py-5">
        <span className="text-base font-semibold tracking-[-0.01em]">
          {m.home_waitlist_card_title({}, { locale })}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          {m.home_waitlist_card_meta({}, { locale })}
        </span>
      </div>

      {submitted ? (
        <SuccessState locale={locale} onAgain={handleAgain} />
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="p-6">
          <div>
            <label
              htmlFor="wl-email"
              className="mb-2.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground"
            >
              {m.home_waitlist_email_label({}, { locale })}
            </label>
            <input
              id="wl-email"
              type="email"
              autoComplete="email"
              placeholder={m.home_waitlist_email_placeholder({}, { locale })}
              aria-invalid={Boolean(errors.email)}
              {...register("email")}
              className="w-full rounded-md border border-border bg-background px-3.5 py-3.5 text-[15px] tracking-[-0.005em] text-foreground placeholder:text-muted-foreground/75 transition-[border-color,box-shadow] focus:border-[color-mix(in_oklch,var(--color-primary)_55%,var(--color-border))] focus:outline-none focus:ring-[3px] focus:ring-ring"
            />
            {errors.email ? (
              <p className="mt-2 text-[12.5px] text-destructive" role="alert">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <fieldset className="mt-[22px]">
            <legend className="mb-2.5 block font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {m.home_waitlist_platform_label({}, { locale })}
            </legend>
            <Controller
              name="platform"
              control={control}
              render={({ field }) => (
                <div
                  role="radiogroup"
                  aria-label={m.home_waitlist_platform_label({}, { locale })}
                  aria-invalid={Boolean(errors.platform)}
                  className="grid grid-cols-2 gap-2.5 sm:grid-cols-4"
                >
                  {platforms.map((option) => (
                    <PlatformCard
                      key={option.value}
                      option={option}
                      selected={field.value === option.value}
                      onSelect={() => field.onChange(option.value)}
                      onBlur={field.onBlur}
                    />
                  ))}
                </div>
              )}
            />
            {errors.platform ? (
              <p className="mt-2 text-[12.5px] text-destructive" role="alert">
                {errors.platform.message}
              </p>
            ) : null}
          </fieldset>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[38ch] text-[12px] leading-[1.5] text-muted-foreground">
              {m.home_waitlist_fine({}, { locale })}
            </p>
            <Button type="submit" size="lg" disabled={isSubmitting} className="shrink-0">
              {m.home_waitlist_submit({}, { locale })}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          </div>

          {submitError ? (
            <p className="mt-3 text-[12.5px] text-destructive" role="alert">
              {submitError}
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}

function mapPlatformToApi(platform: Platform): ApiPlatform {
  switch (platform) {
    case "macOS":
      return "macos";
    case "Windows":
      return "windows";
    case "Linux":
      return "linux";
    case "Browser":
      return "browser";
  }
}

interface PlatformCardProps {
  option: PlatformOption;
  selected: boolean;
  onSelect: () => void;
  onBlur: () => void;
}

function PlatformCard({
  option,
  selected,
  onSelect,
  onBlur,
}: PlatformCardProps): React.ReactElement {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      onBlur={onBlur}
      className={cn(
        "relative flex cursor-pointer flex-col items-start gap-1 rounded-md border border-border bg-background px-3.5 py-3.5 text-left transition-colors",
        "hover:border-[color-mix(in_oklch,var(--color-foreground)_22%,var(--color-border))] hover:bg-[color-mix(in_oklch,var(--color-muted)_50%,var(--color-background))]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected &&
          "border-[color-mix(in_oklch,var(--color-primary)_55%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_5%,var(--color-background))] shadow-[0_0_0_3px_color-mix(in_oklch,var(--color-primary)_14%,transparent)]"
      )}
    >
      <span
        aria-hidden="true"
        className="mb-1 inline-flex size-8 items-center justify-center rounded-lg border border-border bg-[color-mix(in_oklch,var(--color-muted)_80%,var(--color-background))]"
      >
        <Image
          src={option.logo}
          alt={option.logoAlt}
          width={16}
          height={16}
          className="h-4 w-4 opacity-75"
        />
      </span>
      <span className="text-[14px] font-medium tracking-[-0.005em] text-foreground">
        {option.name}
      </span>
      <span className="font-mono text-[10px] tracking-[0.12em] text-muted-foreground">
        {option.arch}
      </span>
    </button>
  );
}

function SuccessState({
  locale,
  onAgain,
}: {
  locale: Locale;
  onAgain: () => void;
}): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      className="m-6 rounded-md border border-[color-mix(in_oklch,var(--color-primary)_35%,var(--color-border))] bg-[color-mix(in_oklch,var(--color-primary)_4%,var(--color-background))] p-6"
    >
      <p className="text-[15px] font-semibold tracking-[-0.01em]">
        {m.home_waitlist_success_title({}, { locale })}
      </p>
      <p className="mt-1.5 text-[13.5px] leading-[1.65] text-muted-foreground">
        {m.home_waitlist_success_message({}, { locale })}
      </p>
      <button
        type="button"
        onClick={onAgain}
        className="mt-3.5 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-[0.12em] text-primary transition-colors hover:underline"
      >
        {m.home_waitlist_again({}, { locale })}
        <span aria-hidden="true">→</span>
      </button>
    </div>
  );
}
