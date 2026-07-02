import { useCallback, useMemo } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { m } from "~/paraglide/messages";
import { useExtensionPreferences } from "~/features/settings/hooks/use-extension-preferences";
import { SkillRow } from "../components/skill-row";
import { SkillsEmptyState } from "../components/skills-empty-state";
import { useSkillMutations, type SkillMutations } from "../hooks/use-skill-mutations";
import { useSkillsList, type SkillListItem } from "../hooks/use-skills-list";

const NONE_VALUE = "__none__";

function LoadingState(): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="space-y-2">
        <div className="h-6 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded-md bg-muted/60" />
      </div>
      <div className="space-y-1 pt-2">
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}): React.ReactElement {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
      <p className="text-sm text-destructive">{message}</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        {m.skills_error_load_retry()}
      </Button>
    </div>
  );
}

function AutoApplySelect({
  installed,
  value,
  onChange,
}: {
  installed: SkillListItem[];
  value: string | null;
  onChange: (id: string | null) => void;
}): React.ReactElement {
  return (
    <section className="rounded-lg border border-border bg-card p-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {m.skills_auto_apply_title()}
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">{m.skills_auto_apply_hint()}</p>
      <div className="mt-2.5 flex items-center gap-2">
        <label htmlFor="auto-apply-select" className="shrink-0 text-sm text-foreground">
          {m.skills_auto_apply_label()}
        </label>
        <Select
          value={value ?? NONE_VALUE}
          onValueChange={(next) => onChange(next === NONE_VALUE ? null : next)}
        >
          <SelectTrigger id="auto-apply-select" className="h-10 flex-1">
            <SelectValue placeholder={m.skills_auto_apply_placeholder()} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE_VALUE}>{m.skills_auto_apply_none()}</SelectItem>
            {installed.map((skill) => (
              <SelectItem key={skill.id} value={skill.id}>
                {skill.displayName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

function SkillSection({
  title,
  skills,
  pendingId,
  onToggleInstall,
}: {
  title: string;
  skills: SkillListItem[];
  pendingId: string | null;
  onToggleInstall: (id: string) => void;
}): React.ReactElement | null {
  if (skills.length === 0) return null;
  return (
    <section>
      <h2 className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="space-y-0.5">
        {skills.map((skill) => (
          <SkillRow
            key={skill.id}
            skill={skill}
            isPending={pendingId === skill.id}
            onToggleInstall={onToggleInstall}
          />
        ))}
      </div>
    </section>
  );
}

function SkillsContent({
  skills,
  pendingId,
  onToggleInstall,
  defaultSkillId,
  onSetDefault,
}: {
  skills: SkillListItem[];
  pendingId: string | null;
  onToggleInstall: (id: string) => void;
  defaultSkillId: string | null;
  onSetDefault: (id: string | null) => void;
}): React.ReactElement {
  const installed = useMemo(() => skills.filter((s) => s.isInstalled), [skills]);
  const available = useMemo(() => skills.filter((s) => !s.isInstalled), [skills]);

  if (skills.length === 0) return <SkillsEmptyState />;

  const selectedDefault = installed.some((s) => s.id === defaultSkillId) ? defaultSkillId : null;

  return (
    <div className="flex flex-col gap-6">
      {installed.length > 0 && (
        <AutoApplySelect installed={installed} value={selectedDefault} onChange={onSetDefault} />
      )}
      <SkillSection
        title={m.skills_section_installed()}
        skills={installed}
        pendingId={pendingId}
        onToggleInstall={onToggleInstall}
      />
      <SkillSection
        title={m.skills_section_available()}
        skills={available}
        pendingId={pendingId}
        onToggleInstall={onToggleInstall}
      />
    </div>
  );
}

function resolvePendingId(mutations: SkillMutations): string | null {
  if (mutations.install.isPending)
    return (mutations.install.variables as string | undefined) ?? null;
  if (mutations.uninstall.isPending)
    return (mutations.uninstall.variables as string | undefined) ?? null;
  return null;
}

export function SkillsListPage(): React.ReactElement {
  const { data, isLoading, isError, error, refetch } = useSkillsList();
  const mutations = useSkillMutations();
  const { defaultSkillId, setDefaultSkillId } = useExtensionPreferences();

  const skills = data?.skills ?? [];
  const handleToggleInstall = useCallback(
    (id: string) => {
      const skill = skills.find((s) => s.id === id);
      if (!skill) return;
      if (skill.isInstalled) {
        mutations.uninstall.mutate(id);
      } else {
        mutations.install.mutate(id);
      }
    },
    [skills, mutations.install, mutations.uninstall]
  );

  if (isLoading) return <LoadingState />;
  if (isError) {
    const message = error instanceof Error ? error.message : m.skills_error_load_title();
    return <ErrorState message={message} onRetry={() => void refetch()} />;
  }

  const pendingId = resolvePendingId(mutations);

  return (
    <div className="flex flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{m.skills_title()}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{m.skills_subtitle()}</p>
      </header>
      <SkillsContent
        skills={skills}
        pendingId={pendingId}
        onToggleInstall={handleToggleInstall}
        defaultSkillId={defaultSkillId}
        onSetDefault={setDefaultSkillId}
      />
    </div>
  );
}
