"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ChevronDown, Gift, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SIGN_UP_PASSWORD_MAX_LENGTH,
  SIGN_UP_PASSWORD_MIN_LENGTH,
  buildSignUpSchema,
  type SignUpFormValues,
  type SignUpResponse,
} from "@/lib/sign-up";
import { m } from "~/paraglide/messages";

interface SignUpFormProps {
  electronQuery?: Record<string, string> | null;
  affiliateEnabled?: boolean;
}

function getInitialCode(searchParams: ReturnType<typeof useSearchParams>): string {
  return (searchParams.get("code") ?? searchParams.get("ref") ?? "").trim();
}

function useSignUpFormState(initialCode: string) {
  return useForm<SignUpFormValues>({
    resolver: zodResolver(buildSignUpSchema()),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      code: initialCode || undefined,
    },
  });
}

async function submitSignUp(values: SignUpFormValues): Promise<Response> {
  return fetch("/api/sign-up", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
}

async function parseSignUpResponse(response: Response): Promise<SignUpResponse | null> {
  return (await response.json().catch(() => null)) as SignUpResponse | null;
}

async function handleSignUpSubmit({
  values,
  electronQuery,
  setRootError,
  setError,
  router,
}: {
  values: SignUpFormValues;
  electronQuery?: Record<string, string> | null;
  setRootError: (message: string | null) => void;
  setError: ReturnType<typeof useForm<SignUpFormValues>>["setError"];
  router: ReturnType<typeof useRouter>;
}): Promise<void> {
  setRootError(null);

  try {
    const response = await submitSignUp(values);
    const data = await parseSignUpResponse(response);
    if (isSuccessfulSignUp(response, data)) {
      router.push(buildSuccessRedirect(values, data, electronQuery));
      return;
    }

    if (isFailedSignUp(data)) {
      applySignUpErrors(data, values, setError, setRootError);
      return;
    }

    router.push("/sign-up/error?reason=server");
  } catch {
    router.push("/sign-up/error?reason=network");
  }
}

function isSuccessfulSignUp(
  response: Response,
  data: SignUpResponse | null
): data is SignUpResponse & { success: true } {
  return response.ok && data?.success === true;
}

function isFailedSignUp(data: SignUpResponse | null): data is SignUpResponse & { success: false } {
  return data?.success === false;
}

function AccountFields({
  errors,
  register,
}: {
  errors: ReturnType<typeof useForm<SignUpFormValues>>["formState"]["errors"];
  register: ReturnType<typeof useForm<SignUpFormValues>>["register"];
}): React.ReactElement {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">{m.signup_field_name_label()}</Label>
        <Input
          id="name"
          autoComplete="name"
          placeholder={m.signup_field_name_placeholder()}
          aria-invalid={Boolean(errors.name)}
          {...register("name")}
        />
        <FieldError message={errors.name?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{m.signup_field_email_label()}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={m.signup_field_email_placeholder()}
          aria-invalid={Boolean(errors.email)}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{m.signup_field_password_label()}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          minLength={SIGN_UP_PASSWORD_MIN_LENGTH}
          maxLength={SIGN_UP_PASSWORD_MAX_LENGTH}
          placeholder={m.signup_field_password_placeholder()}
          aria-invalid={Boolean(errors.password)}
          {...register("password")}
        />
        <FieldError message={errors.password?.message} />
        <p className="text-xs text-muted-foreground">{m.signup_field_password_hint()}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{m.signup_field_confirm_password_label()}</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder={m.signup_field_confirm_password_placeholder()}
          aria-invalid={Boolean(errors.confirmPassword)}
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
      </div>
    </>
  );
}

function SignUpMetaFields({
  initialCode,
  affiliateEnabled,
  errors,
  register,
}: {
  initialCode: string;
  affiliateEnabled?: boolean;
  errors: ReturnType<typeof useForm<SignUpFormValues>>["formState"]["errors"];
  register: ReturnType<typeof useForm<SignUpFormValues>>["register"];
}): React.ReactElement | null {
  if (!affiliateEnabled) return null;

  return (
    <AffiliateField
      defaultOpen={Boolean(initialCode)}
      error={errors.code?.message}
      register={register("code")}
    />
  );
}

function SignUpFormFields({
  electronQuery,
  initialCode,
  affiliateEnabled,
  errors,
  rootError,
  register,
  isSubmitting,
}: {
  electronQuery?: Record<string, string> | null;
  initialCode: string;
  affiliateEnabled?: boolean;
  errors: ReturnType<typeof useForm<SignUpFormValues>>["formState"]["errors"];
  rootError: string | null;
  register: ReturnType<typeof useForm<SignUpFormValues>>["register"];
  isSubmitting: boolean;
}): React.ReactElement {
  return (
    <div className="space-y-5">
      <GoogleSignInButton electronQuery={electronQuery ?? undefined} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {m.auth_or_continue_with()}
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <FieldError message={rootError} />

      <AccountFields errors={errors} register={register} />
      <SignUpMetaFields
        initialCode={initialCode}
        affiliateEnabled={affiliateEnabled}
        errors={errors}
        register={register}
      />

      <SubmitButton isSubmitting={isSubmitting} />
    </div>
  );
}

function buildSuccessRedirect(
  values: SignUpFormValues,
  data: Extract<SignUpResponse, { success: true }>,
  electronQuery?: Record<string, string> | null
): string {
  if (electronQuery) {
    const params = new URLSearchParams(electronQuery);
    params.set("email", values.email);
    return `/sign-in?${params.toString()}`;
  }

  const params = new URLSearchParams({ email: values.email });
  if (data.trialDays) {
    params.set("trial_days", String(data.trialDays));
  }
  return `/download?${params.toString()}`;
}

function applySignUpErrors(
  data: Extract<SignUpResponse, { success: false }>,
  values: SignUpFormValues,
  setError: ReturnType<typeof useForm<SignUpFormValues>>["setError"],
  setRootError: (message: string | null) => void
): void {
  data.errors.forEach((error) => {
    if (error.field && error.field in values) {
      setError(error.field, { message: error.message });
      return;
    }

    setRootError(error.message);
  });

  if (data.errors.length === 0) {
    setRootError(m.er_internal());
  }
}

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }): React.ReactElement {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          {m.signup_submit_pending()}
        </>
      ) : (
        <>
          {m.signup_submit_idle()}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </>
      )}
    </Button>
  );
}

export function SignUpForm({
  electronQuery,
  affiliateEnabled,
}: SignUpFormProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = getInitialCode(searchParams);
  const [rootError, setRootError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useSignUpFormState(initialCode);

  return (
    <form
      className="w-full rounded-md border border-border bg-background/90 p-5 shadow-sm sm:p-6"
      onSubmit={handleSubmit((values) =>
        handleSignUpSubmit({ values, electronQuery, setRootError, setError, router })
      )}
      noValidate
    >
      <SignUpFormFields
        electronQuery={electronQuery}
        initialCode={initialCode}
        affiliateEnabled={affiliateEnabled}
        errors={errors}
        rootError={rootError}
        register={register}
        isSubmitting={isSubmitting}
      />
    </form>
  );
}

function AffiliateField({
  defaultOpen,
  error,
  register,
}: {
  defaultOpen: boolean;
  error?: string;
  register: ReturnType<ReturnType<typeof useForm<SignUpFormValues>>["register"]>;
}): React.ReactElement {
  const benefits = [
    { label: m.signup_benefit_time_label(), detail: m.signup_benefit_time_detail() },
    { label: m.signup_benefit_entry_label(), detail: m.signup_benefit_entry_detail() },
    { label: m.signup_benefit_habit_label(), detail: m.signup_benefit_habit_detail() },
  ];

  return (
    <details
      open={defaultOpen}
      className="group rounded-md border border-border bg-muted/40 open:bg-background"
    >
      <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 text-sm">
        <Gift className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-medium text-foreground">{m.signup_affiliate_toggle_title()}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {m.signup_affiliate_toggle_subtitle()}
          </p>
        </div>
        <ChevronDown
          className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="space-y-5 border-t border-border px-4 pt-4 pb-4">
        <div className="space-y-2">
          <Label htmlFor="code">{m.signup_field_affiliate_label()}</Label>
          <Input
            id="code"
            autoComplete="off"
            placeholder={m.signup_field_affiliate_placeholder()}
            aria-invalid={Boolean(error)}
            {...register}
          />
          <FieldError message={error} />
        </div>

        <dl className="grid grid-cols-[5.5rem_1fr] gap-x-4 gap-y-2.5 text-xs leading-5">
          {benefits.map((benefit) => (
            <div key={benefit.label} className="contents">
              <dt className="font-mono uppercase tracking-[0.18em] text-muted-foreground">
                {benefit.label}
              </dt>
              <dd className="text-muted-foreground">{benefit.detail}</dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  );
}

function FieldError({ message }: { message?: string | null }): React.ReactElement | null {
  if (!message) return null;

  return (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}
