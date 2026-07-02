import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { AppLogo } from "~/components/app-logo";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { authClient } from "~/lib/auth-client";
import { signInWithGoogle } from "~/lib/google-auth";
import { m } from "~/paraglide/messages";
import { router } from "./router";

const schema = z.object({
  email: z.string().email(m.login_email_invalid()),
  password: z.string().min(1, m.login_password_required()),
});

type FormValues = z.infer<typeof schema>;

function openTab(path: string) {
  void chrome.tabs.create({ url: `${import.meta.env.VITE_WEB_URL}${path}` });
}

function GoogleButton({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  if (isLoading) {
    return (
      <Button type="button" variant="outline" disabled className="w-full">
        <Loader2 className="size-4 animate-spin" />
        {m.login_submitting()}
      </Button>
    );
  }
  return (
    <Button type="button" variant="outline" className="w-full" onClick={onClick}>
      <span className="mr-2 font-bold">G</span>
      {m.login_google()}
    </Button>
  );
}

export function LoginPage() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      void router.navigate({ to: "/" });
    } catch (err) {
      if (err instanceof Error && err.name === "user_cancelled") return;
      form.setError("root", { message: m.login_error_google() });
    } finally {
      setIsGoogleLoading(false);
    }
  }

  async function onSubmit(values: FormValues) {
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (result.error) {
      const message =
        result.error.code === "INVALID_EMAIL_OR_PASSWORD"
          ? m.login_error_invalid_credentials()
          : result.error.code === "EMAIL_NOT_VERIFIED"
            ? m.login_error_email_not_verified()
            : m.login_error_connection();
      form.setError("root", { message });
      return;
    }
    void router.navigate({ to: "/" });
  }

  return (
    <div className="flex min-h-full items-center px-5 py-6">
      <div className="w-full space-y-6">
        <div className="space-y-6">
          <div className="flex justify-center">
            <AppLogo className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">{m.login_heading()}</h1>
            <p className="text-sm text-muted-foreground">{m.login_subtitle()}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{m.login_email_label()}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder={m.login_email_placeholder()}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{m.login_password_label()}</FormLabel>
                    <button
                      type="button"
                      onClick={() => openTab("/forgot-password")}
                      className="text-xs text-primary hover:underline"
                    >
                      {m.login_forgot_password()}
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.formState.errors.root && (
              <div
                role="alert"
                aria-live="polite"
                className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {form.formState.errors.root.message}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? m.login_submitting() : m.login_submit()}
            </Button>
          </form>
        </Form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span aria-hidden="true" className="text-xs text-muted-foreground">
            ou
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <GoogleButton isLoading={isGoogleLoading} onClick={handleGoogleSignIn} />

        <p className="text-center text-xs text-muted-foreground">
          {m.login_no_account()}{" "}
          <button
            type="button"
            onClick={() => openTab("/sign-up")}
            className="text-primary hover:underline"
          >
            {m.login_create_account()}
          </button>
        </p>
      </div>
    </div>
  );
}
