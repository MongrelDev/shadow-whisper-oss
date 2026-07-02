import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePortal() {
  const { mutate: openPortal, isPending } = useMutation({
    mutationFn: async () => {
      const result = await window.api.auth.subscriptionBillingPortal();
      if (result.error) {
        throw new Error(result.error.message ?? "Falha ao abrir portal");
      }
      if (result.url) {
        window.api.shell.openExternal(result.url);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Falha ao abrir portal";
      toast.error(message);
    },
  });

  return { openPortal, isPending };
}
