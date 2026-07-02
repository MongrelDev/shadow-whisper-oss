import { ExternalLink } from "lucide-react";
import { m } from "~/paraglide/messages";
import { SettingsCard } from "./settings-primitives";
import { PlanHeader } from "./plan-header";
import { UsageProgress } from "./usage-progress";
import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import type { Plan, DisplayStatus } from "../../../../shared/ipc-types";

interface AccountSectionProps {
  displayName: string;
  displayEmail: string;
  plan: Plan;
  displayStatus: DisplayStatus;
  periodEndDate: string | null;
  usage: {
    totalWords: number;
    limit: number;
    spokenWords: number;
    transformedWords: number;
  };
  daysUntilReset: number | null;
  onUpgrade: () => void;
  onPortal: () => void;
  isPortalPending: boolean;
  onVerify: () => void;
  isVerifying: boolean;
}

export function AccountSection({
  displayName,
  displayEmail,
  plan,
  displayStatus,
  periodEndDate,
  usage,
  daysUntilReset,
  onUpgrade,
  onPortal,
  isPortalPending,
  onVerify,
  isVerifying,
}: AccountSectionProps): React.ReactElement {
  const showUsageBar = displayStatus === "free" || displayStatus === "canceled";

  return (
    <SettingsCard>
      <UserInfo name={displayName} email={displayEmail} />

      <div className="rounded-xl bg-muted/40 p-4 mt-3">
        <PlanHeader plan={plan} displayStatus={displayStatus} periodEndDate={periodEndDate} />

        {showUsageBar && <UsageProgress {...usage} daysUntilReset={daysUntilReset} />}

        <ActionButtons
          displayStatus={displayStatus}
          onUpgrade={onUpgrade}
          onPortal={onPortal}
          isPortalPending={isPortalPending}
          onVerify={onVerify}
          isVerifying={isVerifying}
        />
      </div>
    </SettingsCard>
  );
}

interface ActionButtonsProps {
  displayStatus: DisplayStatus;
  onUpgrade: () => void;
  onPortal: () => void;
  isPortalPending: boolean;
  onVerify: () => void;
  isVerifying: boolean;
}

function ActionButtons({
  displayStatus,
  onUpgrade,
  onPortal,
  isPortalPending,
  onVerify,
  isVerifying,
}: ActionButtonsProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2.5">
      {displayStatus === "free" && (
        <Button variant="default" size="sm" className="text-xs h-8" onClick={onUpgrade}>
          {m.settings_account_upgrade_button()}
        </Button>
      )}
      {displayStatus === "canceled" && (
        <Button variant="default" size="sm" className="text-xs h-8" onClick={onUpgrade}>
          {m.settings_account_resubscribe_button()}
        </Button>
      )}
      {(displayStatus === "active" ||
        displayStatus === "canceling" ||
        displayStatus === "canceled") && (
        <AsyncButton
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5"
          onClick={onPortal}
          isPending={isPortalPending}
          pendingLabel={m.settings_account_portal_pending()}
          icon={<ExternalLink className="h-3 w-3" />}
        >
          {m.settings_account_portal_button()}
        </AsyncButton>
      )}
      <AsyncButton
        variant="outline"
        size="sm"
        className="text-xs h-8 gap-1.5"
        onClick={onVerify}
        isPending={isVerifying}
        pendingLabel={m.settings_account_verify_pending()}
        icon={<ExternalLink className="h-3 w-3" />}
      >
        {m.settings_account_verify_button()}
      </AsyncButton>
    </div>
  );
}

function UserInfo({ name, email }: { name: string; email: string }): React.ReactElement {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0 text-sm font-semibold text-muted-foreground">
        {name[0]?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-foreground truncate">{name}</p>
        <p className="text-sm text-muted-foreground truncate">{email}</p>
      </div>
    </div>
  );
}
