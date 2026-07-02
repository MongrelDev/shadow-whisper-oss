import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useSnippetMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["dictionary"] });

  const addSnippet = useMutation({
    mutationFn: async ({ trigger, expanded }: { trigger: string; expanded: string }) => {
      const result = await window.api.dictionary.addSnippet(trigger, expanded);
      if (!result.success) throw new Error(result.error ?? "Failed to add snippet");
      return result.data!;
    },
    onSuccess: invalidate,
    onError: () => toast.error("Não foi possível adicionar o snippet"),
  });

  const removeSnippet = useMutation({
    mutationFn: async (id: number) => {
      const result = await window.api.dictionary.removeSnippet(id);
      if (!result.success) throw new Error(result.error ?? "Failed to remove snippet");
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["dictionary"] });
      const previous = queryClient.getQueryData<Dictionary>(["dictionary"]);
      queryClient.setQueryData<Dictionary>(["dictionary"], (old) =>
        old ? { ...old, snippets: old.snippets.filter((s) => s.id !== id) } : old
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(["dictionary"], context.previous);
      toast.error("Não foi possível remover o snippet");
    },
    onSettled: invalidate,
  });

  return { addSnippet, removeSnippet };
}
