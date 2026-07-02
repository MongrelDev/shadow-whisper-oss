"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { GoogleSignInButton } from "@/components/google-sign-in-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { m } from "~/paraglide/messages";

interface SignInFormProps {
  electronQuery?: Record<string, string> | null;
}

function buildDesktopHandoffPath(electronQuery: Record<string, string>): string {
  const params = new URLSearchParams(electronQuery);
  return `/auth/desktop?${params.toString()}`;
}

function buildSignUpPath(electronQuery?: Record<string, string> | null): string {
  if (!electronQuery) return "/sign-up";
  const params = new URLSearchParams(electronQuery);
  return `/sign-up?${params.toString()}`;
}

function buildSignInSchema() {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, m.auth_sign_in_error_email_missing())
      .email(m.auth_sign_in_error_email_invalid()),
    password: z.string().min(1, m.auth_sign_in_error_password_required()),
  });
}

type SignInFormValues = z.infer<ReturnType<typeof buildSignInSchema>>;

function mapSignInError(error: { code?: string; message?: string }): string {
  if (error.code === "EMAIL_NOT_VERIFIED") return m.auth_sign_in_error_email_not_verified();
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return m.auth_sign_in_error_invalid_credentials();
  }
  if (error.code === "AUTH_SERVICE_UNAVAILABLE") return m.er_internal();
  return error.message ?? m.er_internal();
}

export function SignInForm({ electronQuery }: SignInFormProps): React.ReactElement {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);
  const schema = useMemo(() => buildSignInSchema(), []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: SignInFormValues) => {
    setRootError(null);

    try {
      const { error } = await authClient.signIn.email({
        email: values.email,
        password: values.password,
        callbackURL: new URL("/auth/verified", window.location.origin).toString(),
        fetchOptions: {
          ...(electronQuery ? { query: electronQuery } : {}),
        },
      });

      if (error) {
        setRootError(mapSignInError(error));
        return;
      }

      router.push(electronQuery ? buildDesktopHandoffPath(electronQuery) : "/");
    } catch {
      setRootError(m.er_internal());
    }
  };

  return (
    <form
      className="w-full rounded-md border border-border bg-background/90 p-5 shadow-sm sm:p-6"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
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

        <div className="space-y-2">
          <Label htmlFor="email">{m.auth_sign_in_field_email_label()}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            aria-invalid={Boolean(errors.email)}
            {...register("email")}
          />
          <FieldError message={errors.email?.message} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{m.auth_sign_in_field_password_label()}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder={m.auth_sign_in_field_password_placeholder()}
            aria-invalid={Boolean(errors.password)}
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        <SignInSubmitButton isSubmitting={isSubmitting} />

        <p className="text-center text-sm text-muted-foreground">
          {m.auth_sign_in_no_account()}{" "}
          <Link
            href={buildSignUpPath(electronQuery)}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {m.auth_sign_in_signup_link()}
          </Link>
        </p>
      </div>
    </form>
  );
}

function SignInSubmitButton({ isSubmitting }: { isSubmitting: boolean }): React.ReactElement {
  return (
    <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
          {m.auth_sign_in_submit_pending()}
        </>
      ) : (
        <>
          {m.auth_sign_in_submit_idle()}
          <ArrowRight className="ml-2 size-4" aria-hidden="true" />
        </>
      )}
    </Button>
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
