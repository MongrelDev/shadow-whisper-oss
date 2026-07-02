import { useNavigate, useSearch } from "@tanstack/react-router";
import { useConfig } from "@/hooks/use-config";
import { db } from "@/lib/db";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DeleteAudioModal(): React.ReactElement {
  const search = useSearch({ from: "/app-shell/protected/app" });
  const navigate = useNavigate();
  const { updateConfig } = useConfig();

  const isOpen = search.confirm === "delete-audio";

  const handleClose = () => {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, confirm: undefined }),
    });
  };

  const handleConfirm = async () => {
    await db.audioRecordings.clear();
    updateConfig({ preferences: { audio: { localAudioRetention: false } } });
    toast.success("Áudio local excluído");
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar armazenamento local?</DialogTitle>
          <DialogDescription>
            Todo o áudio armazenado localmente será excluído permanentemente. Transcrições
            anteriores não poderão ser reprocessadas.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleConfirm}>
            Excluir tudo e desativar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
