import { UserAvatar } from "~/components/user-avatar";
import { Button } from "~/components/ui/button";
import { useAuth } from "~/hooks/use-auth";
import { useSignOut } from "~/hooks/use-sign-out";
import { m } from "~/paraglide/messages";

function AccountInfo({
  name,
  email,
  image,
}: {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  return (
    <div className="flex items-center gap-3">
      <UserAvatar name={name} email={email} image={image} size="md" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{m.settings_account_signed_in_as()}</p>
        {name && <p className="truncate text-sm font-semibold text-foreground">{name}</p>}
        {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
      </div>
    </div>
  );
}

export function AccountSection() {
  const { user } = useAuth();
  const { signOut } = useSignOut();

  if (!user) return null;

  const image = "image" in user && typeof user.image === "string" ? user.image : null;

  return (
    <section id="account" className="rounded-xl border border-border bg-background p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {m.settings_account_section()}
      </h2>
      <div className="space-y-4">
        <AccountInfo name={user.name} email={user.email} image={image} />
        <div className="h-px bg-border/70" />
        <Button variant="destructive" size="sm" onClick={() => void signOut()} className="w-full">
          {m.settings_account_sign_out()}
        </Button>
      </div>
    </section>
  );
}
