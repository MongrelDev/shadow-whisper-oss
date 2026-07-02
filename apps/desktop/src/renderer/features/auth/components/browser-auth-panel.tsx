import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, LogIn, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { m } from "~/paraglide/messages";

const TokenSchema = z.object({
  token: z.string().trim().min(1, m.auth_browser_token_invalid()),
});

export interface BrowserAuthPanelProps {
  onRequestAuth: () => void;
  isRequestingAuth: boolean;
  requestError: string | null;
  requestSucceeded: boolean;
  fallbackOpen: boolean;
  onFallbackOpenChange: (open: boolean) => void;
  onAuthenticate: (token: string) => void;
  isAuthenticating: boolean;
  authError: string | null;
}

export function BrowserAuthPanel({
  onRequestAuth,
  isRequestingAuth,
  requestError,
  requestSucceeded,
  fallbackOpen,
  onFallbackOpenChange,
  onAuthenticate,
  isAuthenticating,
  authError,
}: BrowserAuthPanelProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <AsyncButton
        type="button"
        size="lg"
        className="w-full gap-2"
        isPending={isRequestingAuth}
        pendingLabel={m.auth_login_browser_redirecting()}
        onClick={onRequestAuth}
      >
        <LogIn className="size-4" aria-hidden="true" />
        {m.auth_login_email_button()}
      </AsyncButton>

      <ErrorAlert message={requestError} />

      <ManualFallbackDisclosure
        visible={requestSucceeded}
        open={fallbackOpen}
        onOpenChange={onFallbackOpenChange}
        onAuthenticate={onAuthenticate}
        isAuthenticating={isAuthenticating}
        authError={authError}
      />
    </div>
  );
}

interface ManualTokenFallbackProps {
  onAuthenticate: (token: string) => void;
  isAuthenticating: boolean;
  authError: string | null;
}

interface ManualFallbackDisclosureProps extends ManualTokenFallbackProps {
  visible: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ManualFallbackDisclosure({
  visible,
  open,
  onOpenChange,
  onAuthenticate,
  isAuthenticating,
  authError,
}: ManualFallbackDisclosureProps): React.ReactElement | null {
  if (!visible) return null;

  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full justify-between gap-3 px-0 py-2 text-left text-sm font-medium"
          >
            <span>{m.auth_browser_fallback_toggle()}</span>
            <ChevronDown
              className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent className="overflow-hidden">
          <ManualTokenFallback
            onAuthenticate={onAuthenticate}
            isAuthenticating={isAuthenticating}
            authError={authError}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function ManualTokenFallback({
  onAuthenticate,
  isAuthenticating,
  authError,
}: ManualTokenFallbackProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(TokenSchema), defaultValues: { token: "" } });

  const onSubmit = handleSubmit(({ token }) => {
    onAuthenticate(token.trim());
  });

  return (
    <div className="flex items-start gap-3 pt-3">
      <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>{m.auth_browser_fallback_hint()}</p>
          <p>{m.auth_browser_fallback_paste()}</p>
        </div>

        <form className="space-y-3" onSubmit={onSubmit} noValidate>
          <div className="space-y-2">
            <Input
              id="desktop-auth-token"
              autoComplete="off"
              spellCheck={false}
              aria-label={m.auth_browser_token_label()}
              aria-invalid={Boolean(errors.token)}
              placeholder={m.auth_browser_token_placeholder()}
              {...register("token")}
            />
            <FieldError message={errors.token?.message ?? null} />
          </div>

          <ErrorAlert message={authError} />

          <AsyncButton
            type="submit"
            className="w-full"
            isPending={isAuthenticating}
            pendingLabel={m.auth_browser_token_submit()}
          >
            {m.auth_browser_token_submit()}
          </AsyncButton>
        </form>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string | null }): React.ReactElement | null {
  if (!message) return null;
  return (
    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

function FieldError({ message }: { message: string | null }): React.ReactElement | null {
  if (!message) return null;
  return (
    <p className="text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}
