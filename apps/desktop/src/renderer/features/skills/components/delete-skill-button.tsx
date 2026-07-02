import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteSkillButtonProps {
  onConfirm: () => void;
  pending: boolean;
}

function DeleteTrigger({
  onClick,
  pending,
}: {
  onClick: () => void;
  pending: boolean;
}): React.ReactElement {
  if (pending) {
    return (
      <Button variant="destructive" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
        {m.skills_action_deleting()}
      </Button>
    );
  }
  return (
    <Button variant="destructive" onClick={onClick}>
      <Trash2 className="w-4 h-4" />
      {m.skills_action_delete()}
    </Button>
  );
}

export function DeleteSkillButton({
  onConfirm,
  pending,
}: DeleteSkillButtonProps): React.ReactElement {
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    setOpen(false);
    onConfirm();
  };

  return (
    <>
      <DeleteTrigger onClick={() => setOpen(true)} pending={pending} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{m.skills_action_delete_confirm_title()}</DialogTitle>
            <DialogDescription>{m.skills_action_delete_confirm_description()}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {m.skills_action_delete_confirm_cancel()}
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              {m.skills_action_delete_confirm_confirm()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
