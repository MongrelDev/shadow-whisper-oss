import { useNavigate, useSearch } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { m } from "~/paraglide/messages";

export function NotificationsModal(): React.ReactElement {
  const search = useSearch({ from: "/app-shell/protected/app/" });
  const navigate = useNavigate();
  const isOpen = search.modal === "notifications";

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      navigate({ to: "/app", search: {} });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{m.notifications_modal_title()}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground">
            <Bell className="size-5" strokeWidth={1.75} />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {m.notifications_modal_empty_title()}
          </p>
          <DialogDescription className="max-w-xs">
            {m.notifications_modal_empty_subtitle()}
          </DialogDescription>
        </div>
      </DialogContent>
    </Dialog>
  );
}
