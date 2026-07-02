import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "~/lib/api-client";
import { m } from "~/paraglide/messages";
import {
  DICTIONARY_QUERY_KEY,
  type Dictionary,
  type DictionaryWord,
  type Snippet,
} from "./use-dictionary";

function isRateLimited(status: number): boolean {
  return status === 429;
}

function notifyError(status: number, fallbackMessage: string): void {
  if (isRateLimited(status)) {
    toast.error(m.dictionary_error_rate_limited());
    return;
  }
  toast.error(fallbackMessage);
}

export function useDictionaryMutations() {
  const queryClient = useQueryClient();

  const addWord = useMutation({
    mutationFn: async (word: string): Promise<DictionaryWord> => {
      const res = await apiClient.dictionary.words.$post({ json: { word } });
      if (!res.ok) {
        const error = new Error(`status_${res.status}`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
      return (await res.json()) as DictionaryWord;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DICTIONARY_QUERY_KEY });
    },
    onError: (err) => {
      const status = (err as Error & { status?: number }).status ?? 0;
      notifyError(status, m.dictionary_error_add_word());
    },
  });

  const removeWord = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const res = await apiClient.dictionary.words[":id"].$delete({
        param: { id: String(id) },
      });
      if (!res.ok) {
        const error = new Error(`status_${res.status}`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: DICTIONARY_QUERY_KEY });
      const previous = queryClient.getQueryData<Dictionary>(DICTIONARY_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Dictionary>(DICTIONARY_QUERY_KEY, {
          ...previous,
          words: previous.words.filter((w) => w.id !== id),
        });
      }
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DICTIONARY_QUERY_KEY, context.previous);
      }
      const status = (err as Error & { status?: number }).status ?? 0;
      notifyError(status, m.dictionary_error_remove_word());
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DICTIONARY_QUERY_KEY });
    },
  });

  const addSnippet = useMutation({
    mutationFn: async (input: { trigger: string; expanded: string }): Promise<Snippet> => {
      const res = await apiClient.dictionary.snippets.$post({ json: input });
      if (!res.ok) {
        const error = new Error(`status_${res.status}`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
      return (await res.json()) as Snippet;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: DICTIONARY_QUERY_KEY });
    },
    onError: (err) => {
      const status = (err as Error & { status?: number }).status ?? 0;
      notifyError(status, m.dictionary_error_add_snippet());
    },
  });

  const removeSnippet = useMutation({
    mutationFn: async (id: number): Promise<void> => {
      const res = await apiClient.dictionary.snippets[":id"].$delete({
        param: { id: String(id) },
      });
      if (!res.ok) {
        const error = new Error(`status_${res.status}`);
        (error as Error & { status?: number }).status = res.status;
        throw error;
      }
    },
    onMutate: async (id: number) => {
      await queryClient.cancelQueries({ queryKey: DICTIONARY_QUERY_KEY });
      const previous = queryClient.getQueryData<Dictionary>(DICTIONARY_QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<Dictionary>(DICTIONARY_QUERY_KEY, {
          ...previous,
          snippets: previous.snippets.filter((s) => s.id !== id),
        });
      }
      return { previous };
    },
    onError: (err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(DICTIONARY_QUERY_KEY, context.previous);
      }
      const status = (err as Error & { status?: number }).status ?? 0;
      notifyError(status, m.dictionary_error_remove_snippet());
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: DICTIONARY_QUERY_KEY });
    },
  });

  return { addWord, removeWord, addSnippet, removeSnippet };
}

export type DictionaryMutations = ReturnType<typeof useDictionaryMutations>;
