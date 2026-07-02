import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ipcCall } from "../lib/ipc";

export function useShortcuts() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cleanup = window.api.shortcuts.onChanged(() => {
      queryClient.invalidateQueries({ queryKey: ["shortcuts"] });
    });
    return cleanup;
  }, [queryClient]);

  const { data: shortcuts } = useQuery({
    queryKey: ["shortcuts"],
    queryFn: () => ipcCall(() => window.api.shortcuts.get(), "Failed to fetch shortcuts"),
  });

  const { mutateAsync: updateShortcutAsync } = useMutation({
    mutationFn: async ({ key, accelerator }: { key: string; accelerator: string }) => {
      const result = await window.api.shortcuts.set(key, accelerator);
      if (!result.success) throw new Error(result.error ?? "Failed to update shortcut");
      return result;
    },
    onMutate: async ({ key, accelerator }) => {
      await queryClient.cancelQueries({ queryKey: ["shortcuts"] });
      const previous = queryClient.getQueryData<ShortcutConfigData>(["shortcuts"]);
      queryClient.setQueryData<ShortcutConfigData>(["shortcuts"], (old) =>
        old ? { ...old, [key]: accelerator } : old
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["shortcuts"], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["shortcuts"] }),
  });

  return { shortcuts, updateShortcutAsync };
}
