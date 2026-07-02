import { PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";

interface AppHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppHeader({ collapsed, onToggle }: AppHeaderProps): React.ReactElement {
  return (
    <header
      className={cn(
        "relative h-12 shrink-0 flex items-center",
        "bg-background [-webkit-app-region:drag]"
      )}
    >
      <button
        onClick={onToggle}
        style={{ left: 86, top: 11 }}
        className={cn(
          "absolute w-8 h-8 rounded-md flex items-center justify-center [-webkit-app-region:no-drag]",
          "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        )}
        title={collapsed ? m.app_header_expand_sidebar() : m.app_header_collapse_sidebar()}
      >
        {collapsed ? (
          <PanelLeft className="w-[18px] h-[18px]" strokeWidth={1.75} />
        ) : (
          <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.75} />
        )}
      </button>
    </header>
  );
}
