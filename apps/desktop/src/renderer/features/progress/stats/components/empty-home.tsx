import { Mic } from "lucide-react";
import { m } from "~/paraglide/messages";

export function EmptyHome() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border bg-card/40 px-6 py-10 text-center">
      <Mic className="size-8 text-muted-foreground" />
      <p className="text-sm font-medium">{m.empty_home_title()}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{m.empty_home_hint()}</p>
    </div>
  );
}
