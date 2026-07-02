import { useQuery } from "@tanstack/react-query";
import { apiClient } from "~/lib/api-client";

export interface DictionaryWord {
  readonly id: number;
  readonly word: string;
  readonly createdAt: number;
}

export interface Snippet {
  readonly id: number;
  readonly triggerPhrase: string;
  readonly expandedText: string;
  readonly createdAt: number;
}

export interface Dictionary {
  readonly words: readonly DictionaryWord[];
  readonly snippets: readonly Snippet[];
}

export const DICTIONARY_QUERY_KEY = ["dictionary"] as const;

export function useDictionary() {
  return useQuery<Dictionary>({
    queryKey: DICTIONARY_QUERY_KEY,
    queryFn: async () => {
      const res = await apiClient.dictionary.$get();
      if (!res.ok) {
        throw new Error(`Failed to fetch dictionary (${res.status})`);
      }
      return (await res.json()) as Dictionary;
    },
  });
}
