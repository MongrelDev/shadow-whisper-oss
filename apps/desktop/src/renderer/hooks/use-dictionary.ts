import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useDictionary() {
  return useQuery({
    queryKey: ["dictionary"],
    queryFn: async () => {
      const result = await window.api.dictionary.get();
      if (!result.success) throw new Error(result.error ?? "Failed to fetch dictionary");
      return result.data!;
    },
  });
}

export function useDictionaryMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dictionary"] });

  const addWord = useMutation({
    mutationFn: async (word: string) => {
      const result = await window.api.dictionary.addWord(word);
      if (!result.success) throw new Error(result.error ?? "Failed to add word");
      return result.data!;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Não foi possível adicionar a palavra"),
  });

  const removeWord = useMutation({
    mutationFn: async (id: number) => {
      const result = await window.api.dictionary.removeWord(id);
      if (!result.success) throw new Error(result.error ?? "Failed to remove word");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["dictionary"] });
      const previous = queryClient.getQueryData<Dictionary>(["dictionary"]);
      queryClient.setQueryData<Dictionary>(["dictionary"], (old) =>
        old ? { ...old, words: old.words.filter((w) => w.id !== id) } : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["dictionary"], context.previous);
      toast.error("Não foi possível remover a palavra");
    },
    onSettled: invalidate,
  });

  return { addWord, removeWord };
}
