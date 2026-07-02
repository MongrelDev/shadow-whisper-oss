import { useMemo } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, BookOpen, Home, Settings, Sparkles, Users, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";
import { SidebarUserControl } from "@/features/auth/components/sidebar-user-control";
import { useAffiliateEnabled } from "@/features/affiliate/hooks/use-affiliate";
import { m } from "~/paraglide/messages";

interface NavItem {
  label: () => string;
  path: string;
  icon: LucideIcon;
}

const baseNavItems: NavItem[] = [
  { label: () => m.sidebar_home(), path: "/app", icon: Home },
  { label: () => m.sidebar_dictionary(), path: "/app/dictionary", icon: BookOpen },
  { label: () => m.sidebar_skills(), path: "/app/skills", icon: Sparkles },
];

const affiliateNavItem: NavItem = {
  label: () => m.sidebar_affiliate(),
  path: "/app/affiliate",
  icon: Users,
};

interface SidebarProps {
  collapsed: boolean;
  className?: string;
}

export function Sidebar({ collapsed, className }: SidebarProps): React.ReactElement {
  const routerState = useRouterState();
  const navigate = useNavigate();
  const currentPath = routerState.location.pathname;
  const settingsOpen = (routerState.location.search as { settings?: string }).settings === "open";
  const { data: affiliateEnabled = false } = useAffiliateEnabled();
  const navItems = useMemo(
    () => (affiliateEnabled ? [...baseNavItems, affiliateNavItem] : baseNavItems),
    [affiliateEnabled]
  );

  const openNotifications = () => {
    navigate({ to: "/app", search: { modal: "notifications" } });
  };

  const openSettings = () => {
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, settings: "open" }),
    });
  };

  return (
    <aside
      className={cn(
        "flex flex-col shrink-0 bg-background transition-[width] duration-200 overflow-hidden",
        collapsed ? "w-[82px]" : "w-[82px] md:w-[240px]",
        className
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "pt-2 pb-4",
          collapsed ? "px-0 flex justify-center" : "flex justify-center md:justify-start md:px-4"
        )}
      >
        <Link
          to="/app"
          className={cn(
            "flex items-center gap-2.5 shrink-0",
            collapsed ? "justify-center" : "justify-center md:justify-start"
          )}
        >
          <AppLogo className="w-9 h-9 shrink-0" />
          {!collapsed && (
            <span className="hidden md:inline text-sm font-bold text-foreground tracking-tight whitespace-nowrap">
              ShadowWhisper
            </span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 pt-1">
        <div className="space-y-1">
          {navItems.map((item) => (
            <NavLink key={item.path} item={item} currentPath={currentPath} collapsed={collapsed} />
          ))}
        </div>
      </nav>

      {/* Bottom: notifications + settings + user */}
      <div className="px-2 pb-2 space-y-2">
        <div className="space-y-1">
          <NotificationsButton collapsed={collapsed} onClick={openNotifications} />
          <SettingsButton collapsed={collapsed} active={settingsOpen} onClick={openSettings} />
        </div>
        <div className="border-t border-border/40 pt-2">
          <SidebarUserControl collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
}

interface NavLinkProps {
  item: NavItem;
  currentPath: string;
  collapsed: boolean;
}

function NavLink({ item, currentPath, collapsed }: NavLinkProps): React.ReactElement {
  const isActive =
    item.path === "/app" ? currentPath === "/app" : currentPath.startsWith(item.path);

  const Icon = item.icon;
  const linkClassName = cn(
    "flex items-center gap-3 py-2.5 rounded-lg transition-colors overflow-hidden whitespace-nowrap",
    collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:px-3",
    isActive
      ? "bg-accent text-foreground"
      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
  );
  const label = item.label();
  const linkTitle = collapsed ? label : undefined;

  const tourAnchor = TOUR_ANCHOR_BY_PATH[item.path];

  return (
    <Link to={item.path} className={linkClassName} title={linkTitle} data-tour={tourAnchor}>
      <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="hidden md:inline text-sm font-medium">{label}</span>}
    </Link>
  );
}

interface NotificationsButtonProps {
  collapsed: boolean;
  onClick: () => void;
}

function NotificationsButton({ collapsed, onClick }: NotificationsButtonProps): React.ReactElement {
  const label = m.sidebar_notifications();
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-2.5 transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:px-3"
      )}
    >
      <Bell className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="hidden md:inline text-sm font-medium">{label}</span>}
    </button>
  );
}

interface SettingsButtonProps {
  collapsed: boolean;
  active: boolean;
  onClick: () => void;
}

function SettingsButton({ collapsed, active, onClick }: SettingsButtonProps): React.ReactElement {
  const label = m.sidebar_settings();
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      data-tour="nav-settings"
      className={cn(
        "flex w-full items-center gap-3 rounded-lg py-2.5 transition-colors",
        collapsed ? "justify-center px-0" : "justify-center px-0 md:justify-start md:px-3",
        active
          ? "bg-accent text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
    >
      <Settings className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && <span className="hidden md:inline text-sm font-medium">{label}</span>}
    </button>
  );
}

const TOUR_ANCHOR_BY_PATH: Record<string, string | undefined> = {
  "/app/dictionary": "nav-dictionary",
  "/app/skills": "nav-skills",
  "/app/affiliate": "nav-affiliate",
};
