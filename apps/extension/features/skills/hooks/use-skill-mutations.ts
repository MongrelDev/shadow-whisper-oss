import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "~/lib/api-client";
import { m } from "~/paraglide/messages";
import { SKILLS_QUERY_KEY, type SkillListItem } from "./use-skills-list";

type SkillsCache = { skills: SkillListItem[] };

function makeStatusError(status: number): Error {
  const err = new Error(`status_${status}`);
  (err as Error & { status?: number }).status = status;
  return err;
}

function getStatus(err: unknown): number {
  if (err instanceof Error && "status" in err) return (err as { status: number }).status;
  return 0;
}

function notifySkillsChanged(): void {
  chrome.runtime.sendMessage({ target: "background", type: "sp:skills-changed" }).catch(() => {});
}

export function useSkillMutations() {
  const queryClient = useQueryClient();

  const install = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiClient.skills[":id"].install.$post({ param: { id } });
      if (!res.ok) throw makeStatusError(res.status);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: SKILLS_QUERY_KEY });
      const previous = queryClient.getQueryData<SkillsCache>(SKILLS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<SkillsCache>(SKILLS_QUERY_KEY, {
          skills: previous.skills.map((s) => (s.id === id ? { ...s, isInstalled: true } : s)),
        });
      }
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SKILLS_QUERY_KEY, context.previous);
      }
      if (getStatus(err) === 429) {
        toast.error(m.skills_error_rate_limited());
        return;
      }
      toast.error(m.skills_error_install());
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
      notifySkillsChanged();
    },
  });

  const uninstall = useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await apiClient.skills[":id"].install.$delete({ param: { id } });
      if (!res.ok) throw makeStatusError(res.status);
    },
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: SKILLS_QUERY_KEY });
      const previous = queryClient.getQueryData<SkillsCache>(SKILLS_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<SkillsCache>(SKILLS_QUERY_KEY, {
          skills: previous.skills.map((s) => (s.id === id ? { ...s, isInstalled: false } : s)),
        });
      }
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(SKILLS_QUERY_KEY, context.previous);
      }
      if (getStatus(err) === 429) {
        toast.error(m.skills_error_rate_limited());
        return;
      }
      toast.error(m.skills_error_uninstall());
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY });
      notifySkillsChanged();
    },
  });

  return { install, uninstall };
}

export type SkillMutations = ReturnType<typeof useSkillMutations>;
