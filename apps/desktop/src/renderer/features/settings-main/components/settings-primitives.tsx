import { cn } from "@/lib/utils";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { m } from "~/paraglide/messages";

interface SettingsCardProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsCard({ title, children }: SettingsCardProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {title && (
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </h2>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

interface RowProps {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}

export function Row({ label, sublabel, children }: RowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="min-w-0">
        <p className="text-base text-foreground">{label}</p>
        {sublabel && <p className="text-sm text-muted-foreground mt-0.5">{sublabel}</p>}
      </div>
      <div className="shrink-0 ml-6">{children}</div>
    </div>
  );
}

interface ToggleProps {
  enabled: boolean;
  onToggle: () => void;
  label?: string;
}

export function Toggle({ enabled, onToggle, label }: ToggleProps): React.ReactElement {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0",
        enabled ? "bg-violet" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform",
          enabled && "translate-x-5"
        )}
      />
    </button>
  );
}

interface RestoreButtonProps {
  onClick: () => void;
  disabled?: boolean;
  label?: string;
}

export function RestoreButton({
  onClick,
  disabled,
  label,
}: RestoreButtonProps): React.ReactElement {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={disabled}>
      {label ?? m.settings_primitive_restore_default()}
    </Button>
  );
}

interface ShortcutBadgesProps {
  keys: string[];
}

export function ShortcutBadges({ keys }: ShortcutBadgesProps): React.ReactElement {
  return <ShortcutKeys keys={keys} size="md" />;
}

interface HelpLinkProps {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  sublabel: string;
  href: string;
}

export function HelpLink({ icon: Icon, label, sublabel, href }: HelpLinkProps): React.ReactElement {
  return (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        window.api.shell.openExternal(href);
      }}
      className="flex items-center justify-between py-3 group"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4.5 h-4.5 text-muted-foreground" strokeWidth={1.75} />
        <div>
          <p className="text-base text-foreground group-hover:text-foreground/80 transition-colors">
            {label}
          </p>
          <p className="text-sm text-muted-foreground">{sublabel}</p>
        </div>
      </div>
      <ExternalLink className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
    </a>
  );
}
