import { m } from "~/paraglide/messages";

export function LoginForm({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="w-full space-y-8">
      <div className="space-y-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {m.auth_login_title()}
        </h1>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto text-balance">
          {m.auth_login_browser_hint()}
        </p>
      </div>

      {children}
    </div>
  );
}
