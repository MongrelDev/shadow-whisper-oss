import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/lib/api-client";
import type { SkillListItem } from "~/lib/messaging/types";

export const SKILLS_QUERY_KEY = ["skills"] as const;

export type { SkillListItem };

export function useSkillsList() {
  return useQuery<{ skills: SkillListItem[] }>({
    queryKey: SKILLS_QUERY_KEY,
    // The catalog only changes when the user installs/uninstalls a skill, and
    // those mutations invalidate this key. Stay fresh forever otherwise so
    // mounting or refocusing the panel never refetches.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const res = await apiClient.skills.$get({ query: {} });
      if (!res.ok) {
        throw new Error(`Failed to fetch skills (${res.status})`);
      }
      return res.json() as Promise<{ skills: SkillListItem[] }>;
    },
  });
}
