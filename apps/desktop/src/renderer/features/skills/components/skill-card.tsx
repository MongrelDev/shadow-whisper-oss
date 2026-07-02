import { Check, Download, Loader2, Pencil, Trash2 } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import type { Skill } from "../types/skill";
import { SkillShortcutControlContainer } from "../containers/skill-shortcut-control-container";

interface SkillCardProps {
  skill: Skill;
  isInstalled?: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isInstallPending?: boolean;
  isDeletePending?: boolean;
  shortcut?: string | null;
}

export function SkillCard(props: SkillCardProps): React.ReactElement {
  const {
    skill,
    isInstalled = false,
    onInstall,
    onUninstall,
    onEdit,
    onDelete,
    isInstallPending = false,
    isDeletePending = false,
    shortcut = null,
  } = props;

  return (
    <div className="flex items-center gap-4 px-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium tracking-tight text-foreground">
          {skill.displayName}
        </p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground [text-wrap:pretty] max-[479px]:hidden">
          {describeSkill(skill)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 max-[479px]:flex-col max-[479px]:items-end">
        <SkillShortcutControlContainer
          skillId={skill.id}
          accelerator={shortcut}
          disabled={!isInstalled}
        />
        {skill.source === "custom" ? (
          <CustomSkillActions
            onEdit={onEdit}
            onDelete={onDelete}
            isDeletePending={isDeletePending}
          />
        ) : (
          <InstallButton
            isInstalled={isInstalled}
            isPending={isInstallPending}
            displayName={skill.displayName}
            onInstall={onInstall}
            onUninstall={onUninstall}
          />
        )}
      </div>
    </div>
  );
}

function describeSkill(skill: Skill): string {
  const trimmed = skill.description?.trim();
  if (trimmed) return trimmed;
  return m.skills_card_no_description();
}

function CustomSkillActions({
  onEdit,
  onDelete,
  isDeletePending,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  isDeletePending?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5">
      {onEdit && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onEdit}
          title={m.skills_card_edit_label()}
          className="size-8"
        >
          <Pencil className="size-3.5" strokeWidth={1.75} />
        </Button>
      )}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onDelete}
          disabled={isDeletePending}
          title={m.skills_card_delete_label()}
          className="size-8 text-destructive hover:text-destructive"
        >
          {isDeletePending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" strokeWidth={1.75} />
          )}
        </Button>
      )}
    </div>
  );
}

function getInstallCopy(
  isInstalled: boolean,
  displayName: string
): { label: string; ariaLabel: string } {
  if (isInstalled) {
    return {
      label: m.skills_installed_button(),
      ariaLabel: m.skills_installed_tooltip({ displayName }),
    };
  }
  return {
    label: m.skills_install_button(),
    ariaLabel: m.skills_install_tooltip({ displayName }),
  };
}

function InstallButton({
  isInstalled,
  isPending,
  displayName,
  onInstall,
  onUninstall,
}: {
  isInstalled: boolean;
  isPending: boolean;
  displayName: string;
  onInstall?: () => void;
  onUninstall?: () => void;
}): React.ReactElement | null {
  if (!onInstall || !onUninstall) return null;

  const { label, ariaLabel } = getInstallCopy(isInstalled, displayName);
  const handleClick = isInstalled ? onUninstall : onInstall;

  return (
    <Button
      type="button"
      variant={isInstalled ? "secondary" : "outline"}
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-label={ariaLabel}
      aria-pressed={isInstalled}
      className="w-32 text-xs"
    >
      <ButtonIcon isInstalled={isInstalled} isPending={isPending} />
      <span>{label}</span>
    </Button>
  );
}

function ButtonIcon({
  isInstalled,
  isPending,
}: {
  isInstalled: boolean;
  isPending: boolean;
}): React.ReactElement {
  if (isPending) return <Loader2 className="size-3.5 animate-spin" aria-hidden />;
  if (isInstalled) return <Check className="size-3.5" strokeWidth={2.2} aria-hidden />;
  return <Download className="size-3.5" strokeWidth={1.75} aria-hidden />;
}
