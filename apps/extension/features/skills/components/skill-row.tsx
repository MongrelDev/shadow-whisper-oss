import { Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { m } from "~/paraglide/messages";
import type { SkillListItem } from "../hooks/use-skills-list";

function InstallButtonLabel({
  isPending,
  isInstalled,
}: {
  isPending: boolean;
  isInstalled: boolean;
}): React.ReactElement {
  if (isPending) return <Loader2 className="size-3.5 animate-spin" />;
  if (isInstalled) return <>{m.skills_action_uninstall()}</>;
  return <>{m.skills_action_install()}</>;
}

export function SkillRow({
  skill,
  isPending,
  onToggleInstall,
}: {
  skill: SkillListItem;
  isPending: boolean;
  onToggleInstall: (id: string) => void;
}): React.ReactElement {
  return (
    <div className="group flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/50">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{skill.displayName}</p>
        {skill.description && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{skill.description}</p>
        )}
      </div>
      <Button
        size="sm"
        variant={skill.isInstalled ? "outline" : "default"}
        disabled={isPending}
        onClick={() => onToggleInstall(skill.id)}
        className="shrink-0 h-10"
      >
        <InstallButtonLabel isPending={isPending} isInstalled={skill.isInstalled} />
      </Button>
    </div>
  );
}
