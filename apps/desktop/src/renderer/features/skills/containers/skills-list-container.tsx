import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkillsList } from "../hooks/use-skills-rpc";
import { useInstallSkill } from "../hooks/use-install-skill";
import { useUninstallSkill } from "../hooks/use-uninstall-skill";
import { useReconcileOrphanShortcuts } from "../hooks/use-reconcile-orphan-shortcuts";
import { useDeleteCustomSkill } from "../../skill-builder/hooks/use-custom-skill-mutations";
import { useConfig } from "@/hooks/use-config";
import { SkillCard } from "../components/skill-card";
import { SkillFilterBar } from "../components/skill-filter-bar";
import { EmptyState } from "../components/empty-state";
import { SkillBuilderContainer } from "../../skill-builder/containers/skill-builder-container";
import type { Skill } from "../types/skill";
import type { JSX } from "react";

type SkillsTab = "mine" | "official";

function matchesSearch(skill: Skill, term: string): boolean {
  if (term.length === 0) return true;
  return `${skill.displayName} ${skill.slug}`.toLowerCase().includes(term);
}

function filterByTab(skills: Skill[], tab: SkillsTab): Skill[] {
  if (tab === "mine") return skills.filter((s) => s.source === "custom" || s.isInstalled);
  return skills.filter((s) => s.source === "official");
}

function findEditableSkill(
  editSkillId: string | undefined,
  skills: Skill[] | undefined
): Skill | null {
  if (!editSkillId || !skills) return null;
  return skills.find((s) => s.id === editSkillId && s.source === "custom") ?? null;
}

function findOrphanShortcutIds(skills: Skill[], shortcuts: Record<string, string>): string[] {
  const installedIds = new Set(skills.filter((s) => s.isInstalled).map((s) => s.id));
  return Object.keys(shortcuts).filter((id) => !installedIds.has(id));
}

function useOrphanShortcutCleanup(
  skills: Skill[] | undefined,
  shortcuts: Record<string, string>,
  configLoaded: boolean
): void {
  const reconcile = useReconcileOrphanShortcuts();
  const clearedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!skills || !configLoaded || reconcile.isPending) return;
    const orphans = findOrphanShortcutIds(skills, shortcuts).filter(
      (id) => !clearedRef.current.has(id)
    );
    if (orphans.length === 0) return;
    for (const id of orphans) clearedRef.current.add(id);
    reconcile.mutate(orphans);
  }, [skills, shortcuts, configLoaded, reconcile]);
}

function SkillsLoadingState(): React.ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={m.skills_loading()}
      className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-2">
            <span className="block h-4 w-40 animate-pulse rounded bg-muted" />
            <span className="block h-3 w-[70%] animate-pulse rounded bg-muted/70" />
          </div>
          <span className="h-8 w-32 shrink-0 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  );
}

function TabBar({
  tab,
  onTabChange,
}: {
  tab: SkillsTab;
  onTabChange: (tab: SkillsTab) => void;
}): JSX.Element {
  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as SkillsTab)}>
      <TabsList className="h-9">
        <TabsTrigger value="official" className="text-xs">
          {m.skills_tab_official()}
        </TabsTrigger>
        <TabsTrigger value="mine" className="text-xs">
          {m.skills_tab_mine()}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function SkillsContent({
  isLoading,
  skills,
  tab,
  installMutation,
  uninstallMutation,
  deleteMutation,
  onEdit,
  onDelete,
  shortcuts,
}: {
  isLoading: boolean;
  skills: Skill[];
  tab: SkillsTab;
  installMutation: ReturnType<typeof useInstallSkill>;
  uninstallMutation: ReturnType<typeof useUninstallSkill>;
  deleteMutation: ReturnType<typeof useDeleteCustomSkill>;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  shortcuts: Record<string, string>;
}): JSX.Element {
  if (isLoading) return <SkillsLoadingState />;
  if (skills.length === 0) return <EmptyState />;
  return (
    <SkillList
      skills={skills}
      tab={tab}
      installMutation={installMutation}
      uninstallMutation={uninstallMutation}
      deleteMutation={deleteMutation}
      onEdit={onEdit}
      onDelete={onDelete}
      shortcuts={shortcuts}
    />
  );
}

export function SkillsListContainer(): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Skill | null>(null);
  const search = useSearch({ strict: false }) as { tab?: SkillsTab; editSkill?: string };
  const navigate = useNavigate();
  const tab: SkillsTab = search.tab ?? "official";

  const { data: skills, isLoading } = useSkillsList();
  const installMutation = useInstallSkill();
  const uninstallMutation = useUninstallSkill();
  const deleteMutation = useDeleteCustomSkill();
  const { config, loaded } = useConfig();
  useOrphanShortcutCleanup(skills, config.skills.shortcuts, loaded);

  const requestDelete = (skill: Skill) => setPendingDelete(skill);
  const cancelDelete = () => setPendingDelete(null);
  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  };

  const editSkill = findEditableSkill(search.editSkill, skills);

  const setTab = (next: SkillsTab) => {
    void navigate({
      search: ((prev: Record<string, unknown>) => ({ ...prev, tab: next })) as never,
    });
  };

  const openBuilder = () => {
    void navigate({
      search: ((prev: Record<string, unknown>) => {
        const { editSkill: _editSkill, ...rest } = prev;
        return { ...rest, builder: "describe" };
      }) as never,
    });
  };

  const openEdit = (skill: Skill) => {
    void navigate({
      search: ((prev: Record<string, unknown>) => ({
        ...prev,
        builder: "review",
        editSkill: skill.id,
      })) as never,
    });
  };

  const term = searchTerm.trim().toLowerCase();
  const filtered = filterByTab(skills ?? [], tab).filter((skill) => matchesSearch(skill, term));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <TabBar tab={tab} onTabChange={setTab} />
        {tab === "mine" && (
          <Button size="sm" onClick={openBuilder} className="gap-1.5">
            <Plus className="size-3.5" strokeWidth={2} />
            {m.skills_create_skill_cta()}
          </Button>
        )}
      </div>

      <SkillFilterBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      <SkillsContent
        isLoading={isLoading}
        skills={filtered}
        tab={tab}
        installMutation={installMutation}
        uninstallMutation={uninstallMutation}
        deleteMutation={deleteMutation}
        onEdit={openEdit}
        onDelete={requestDelete}
        shortcuts={config.skills.shortcuts}
      />

      <SkillBuilderContainer key={editSkill?.id ?? "new"} editSkill={editSkill} />

      <DeleteConfirmDialog
        skill={pendingDelete}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

interface SkillListProps {
  skills: Skill[];
  tab: SkillsTab;
  installMutation: ReturnType<typeof useInstallSkill>;
  uninstallMutation: ReturnType<typeof useUninstallSkill>;
  deleteMutation: ReturnType<typeof useDeleteCustomSkill>;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
  shortcuts: Record<string, string>;
}

function isPendingFor(mutation: { isPending: boolean; variables?: string }, id: string): boolean {
  return mutation.isPending && mutation.variables === id;
}

function SkillList(props: SkillListProps): JSX.Element {
  const {
    skills,
    tab,
    installMutation,
    uninstallMutation,
    deleteMutation,
    onEdit,
    onDelete,
    shortcuts,
  } = props;

  if (tab === "mine") {
    const custom = skills.filter((s) => s.source === "custom");
    const installed = skills.filter((s) => s.source === "official");
    return (
      <div className="space-y-6">
        {custom.length > 0 && (
          <SkillSection label={m.skills_section_created()}>
            {custom.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                installMutation={installMutation}
                uninstallMutation={uninstallMutation}
                onEdit={() => onEdit(skill)}
                onDelete={() => onDelete(skill)}
                deleteMutation={deleteMutation}
                shortcut={shortcuts[skill.id] ?? null}
              />
            ))}
          </SkillSection>
        )}
        {installed.length > 0 && (
          <SkillSection label={m.skills_section_installed()}>
            {installed.map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                installMutation={installMutation}
                uninstallMutation={uninstallMutation}
                deleteMutation={deleteMutation}
                shortcut={shortcuts[skill.id] ?? null}
              />
            ))}
          </SkillSection>
        )}
      </div>
    );
  }

  return (
    <SkillSection>
      {skills.map((skill) => (
        <SkillRow
          key={skill.id}
          skill={skill}
          installMutation={installMutation}
          uninstallMutation={uninstallMutation}
          deleteMutation={deleteMutation}
          shortcut={shortcuts[skill.id] ?? null}
        />
      ))}
    </SkillSection>
  );
}

function SkillSection({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}): JSX.Element {
  return (
    <div>
      {label && (
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground/70">
          {label}
        </p>
      )}
      <ul className="divide-y divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-card">
        {children}
      </ul>
    </div>
  );
}

function SkillRow({
  skill,
  installMutation,
  uninstallMutation,
  deleteMutation,
  onEdit,
  onDelete,
  shortcut,
}: {
  skill: Skill;
  installMutation: ReturnType<typeof useInstallSkill>;
  uninstallMutation: ReturnType<typeof useUninstallSkill>;
  deleteMutation: ReturnType<typeof useDeleteCustomSkill>;
  onEdit?: () => void;
  onDelete?: () => void;
  shortcut: string | null;
}): JSX.Element {
  return (
    <li key={skill.id}>
      <SkillCard
        skill={skill}
        isInstalled={skill.isInstalled}
        onInstall={() => installMutation.mutate(skill.id)}
        onUninstall={() => uninstallMutation.mutate(skill.id)}
        onEdit={onEdit}
        onDelete={onDelete}
        isInstallPending={
          isPendingFor(installMutation, skill.id) || isPendingFor(uninstallMutation, skill.id)
        }
        isDeletePending={isPendingFor(deleteMutation, skill.id)}
        shortcut={shortcut}
      />
    </li>
  );
}

function DeleteConfirmDialog({
  skill,
  onCancel,
  onConfirm,
}: {
  skill: Skill | null;
  onCancel: () => void;
  onConfirm: () => void;
}): JSX.Element {
  return (
    <Dialog open={skill !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{m.skills_delete_confirm_title()}</DialogTitle>
          <DialogDescription>
            {skill ? m.skills_delete_confirm_body({ name: skill.displayName }) : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {m.skills_shortcut_cancel()}
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            {m.skills_delete_confirm_action()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
