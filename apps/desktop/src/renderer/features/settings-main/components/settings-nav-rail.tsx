import {
  User,
  Palette,
  Globe,
  Mic,
  Keyboard,
  GraduationCap,
  Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { m } from "~/paraglide/messages";
import type { SettingsSection } from "../types/section";

interface NavItem {
  id: SettingsSection;
  label: () => string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "account", label: () => m.settings_nav_account(), icon: User },
  { id: "appearance", label: () => m.settings_nav_appearance(), icon: Palette },
  { id: "languages", label: () => m.settings_nav_languages(), icon: Globe },
  { id: "recording", label: () => m.settings_nav_recording(), icon: Mic },
  { id: "shortcuts", label: () => m.settings_nav_shortcuts(), icon: Keyboard },
  { id: "learning", label: () => m.settings_nav_learning(), icon: GraduationCap },
  { id: "about", label: () => m.settings_nav_about(), icon: Info },
];

interface SettingsNavRailProps {
  active: SettingsSection;
  onSelect: (section: SettingsSection) => void;
}

export function SettingsNavRail({ active, onSelect }: SettingsNavRailProps): React.ReactElement {
  return (
    <nav className="flex w-[200px] shrink-0 flex-col gap-px border-r border-border bg-muted/30 px-2.5 py-5">
      <p className="px-2.5 pb-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {m.settings_nav_heading()}
      </p>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={cn(
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
              isActive
                ? "bg-accent font-medium text-accent-foreground"
                : "text-foreground hover:bg-muted/70"
            )}
          >
            <Icon
              className={cn("h-[15px] w-[15px] shrink-0", isActive ? "opacity-100" : "opacity-65")}
              strokeWidth={1.75}
            />
            {item.label()}
          </button>
        );
      })}
    </nav>
  );
}
