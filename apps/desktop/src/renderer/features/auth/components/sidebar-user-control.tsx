import { useNavigate } from "@tanstack/react-router";
import { ChevronUp, CreditCard, LogIn, LogOut, Settings } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/hooks/use-auth-context";
import { cn } from "@/lib/utils";

interface SidebarUserControlProps {
  collapsed: boolean;
}

export function SidebarUserControl({ collapsed }: SidebarUserControlProps): React.ReactElement {
  const { isSignedIn, user } = useAuthContext();

  if (!isSignedIn || !user) {
    return <GuestRow collapsed={collapsed} />;
  }

  return (
    <SignedInRow collapsed={collapsed} name={user.name} email={user.email} image={user.image} />
  );
}

function GuestRow({ collapsed }: { collapsed: boolean }): React.ReactElement {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/auth/login" })}
      className={cn(
        "flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
        "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        collapsed && "justify-center px-0"
      )}
      title={collapsed ? m.sidebar_user_signin() : undefined}
    >
      <LogIn className="size-[18px] shrink-0" strokeWidth={1.75} />
      {!collapsed && (
        <span className="hidden md:inline text-sm font-medium">{m.sidebar_user_signin()}</span>
      )}
    </button>
  );
}

interface SignedInRowProps {
  collapsed: boolean;
  name: string;
  email: string;
  image: string | null;
}

function SignedInRow({ collapsed, name, email, image }: SignedInRowProps): React.ReactElement {
  const navigate = useNavigate();
  const { signOut } = useAuthContext();
  const initials = getInitials(name, email);

  const openSettings = () =>
    navigate({
      to: ".",
      search: (prev) => ({ ...prev, settings: "open", section: "account" }),
    });
  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center gap-2.5 rounded-lg py-2 text-left transition-colors",
            "text-foreground hover:bg-accent/50",
            collapsed ? "justify-center px-0" : "px-2"
          )}
          title={collapsed ? name : undefined}
        >
          <Avatar className="size-7 shrink-0">
            {image ? <AvatarImage src={image} alt={name} /> : null}
            <AvatarFallback className="bg-muted text-[11px] font-semibold text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="hidden md:flex min-w-0 flex-1 items-center gap-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <p className="truncate text-sm font-semibold leading-tight text-foreground">
                  {name}
                </p>
                <p className="truncate text-[11px] leading-tight text-muted-foreground">{email}</p>
              </div>
              <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-64 rounded-xl border-border/50 p-1.5"
      >
        <DropdownMenuLabel className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="mt-0.5 truncate text-xs font-normal text-muted-foreground">{email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1.5" />
        <MenuItem icon={Settings} label={m.auth_header_menu_my_account()} onClick={openSettings} />
        <MenuItem
          icon={CreditCard}
          label={m.auth_header_menu_subscription()}
          onClick={openSettings}
        />
        <DropdownMenuSeparator className="my-1.5" />
        <MenuItem
          icon={LogOut}
          label={m.auth_header_menu_sign_out()}
          onClick={() => {
            void handleSignOut();
          }}
          variant="destructive"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  variant,
}: {
  icon: typeof Settings;
  label: string;
  onClick: () => void;
  variant?: "destructive";
}): React.ReactElement {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-lg px-2.5 py-2",
        variant === "destructive" && "text-destructive focus:text-destructive"
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      <span className="text-sm">{label}</span>
    </DropdownMenuItem>
  );
}

function getInitials(name: string, email: string): string {
  const fromName = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (fromName.length > 0) return fromName;
  return email.slice(0, 1).toUpperCase();
}
