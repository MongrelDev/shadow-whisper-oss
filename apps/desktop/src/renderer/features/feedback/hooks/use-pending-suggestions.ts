import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PendingSuggestion } from "../types/pending-suggestion";

const QUERY_KEY = ["suggestions", "pending"] as const;

interface UsePendingSuggestionsReturn {
  suggestions: PendingSuggestion[];
  isLoading: boolean;
  accept: (id: string) => void;
  reject: (id: string) => void;
  isAccepting: boolean;
  isRejecting: boolean;
}

export function usePendingSuggestions(): UsePendingSuggestionsReturn {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<PendingSuggestion[]> => {
      const result = await window.api.suggestions.getPending();
      if (!result.success) throw new Error(result.error);
      return result.data.suggestions;
    },
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const invalidate = (): Promise<void> => queryClient.invalidateQueries({ queryKey: QUERY_KEY });

  const acceptMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await window.api.suggestions.accept(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidate,
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const result = await window.api.suggestions.reject(id);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidate,
  });

  return {
    suggestions: query.data ?? [],
    isLoading: query.isLoading,
    accept: acceptMutation.mutate,
    reject: rejectMutation.mutate,
    isAccepting: acceptMutation.isPending,
    isRejecting: rejectMutation.isPending,
  };
}
