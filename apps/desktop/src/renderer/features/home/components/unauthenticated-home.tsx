import { LogIn } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { AppLogo } from "@/components/app-logo";
import { Button } from "@/components/ui/button";

export function UnauthenticatedHome(): React.ReactElement {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center py-24 text-center">
      <AppLogo className="mb-8 h-24 w-24" />
      <h1 className="text-4xl font-bold tracking-tight text-foreground">{m.home_unauth_title()}</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">{m.home_unauth_subtitle()}</p>

      <Button
        onClick={() => navigate({ to: "/auth/login" })}
        className="mt-10 gap-2.5 rounded-xl px-8 py-3 text-base"
      >
        <LogIn className="h-4.5 w-4.5" strokeWidth={1.75} />
        {m.home_unauth_cta()}
      </Button>
    </div>
  );
}
