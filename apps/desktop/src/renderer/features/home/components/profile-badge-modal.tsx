import { useState } from "react";
import { motion } from "motion/react";
import { Share2 } from "lucide-react";
import { m } from "~/paraglide/messages";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatCompactNumber, formatDuration } from "../utils/format";
import { ShareCardModal } from "../../share-cards/containers/share-card-modal";

function UserInitials({ name }: { name: string }): React.ReactElement {
  return (
    <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
      <span className="text-lg font-semibold text-primary">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }): React.ReactElement {
  const labels: Record<string, string> = {
    free: m.home_profile_badge_plan_free_label(),
    pro: m.home_profile_badge_plan_pro_label(),
    active: m.home_profile_badge_plan_pro_label(),
    canceling: m.home_profile_badge_plan_pro_label(),
    canceled: m.home_profile_badge_plan_free_label(),
  };

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold",
        "bg-primary/10 text-primary"
      )}
    >
      {labels[plan] ?? plan}
    </span>
  );
}

function StatCell({
  value,
  label,
  index,
}: {
  value: string;
  label: string;
  index: number;
}): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.04, duration: 0.25 }}
      className="flex flex-col items-center"
    >
      <p className="text-base font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </motion.div>
  );
}

export interface ProfileBadgeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userEmail: string;
  plan: string;
  totalWords: number;
  totalDuration: number;
  totalTranscriptions: number;
  wordsThisWeek: number;
}

export function ProfileBadgeDialog({
  isOpen,
  onClose,
  userName,
  userEmail,
  plan,
  totalWords,
  totalDuration,
  totalTranscriptions,
  wordsThisWeek,
}: ProfileBadgeDialogProps): React.ReactElement {
  const [shareOpen, setShareOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-xs p-0 overflow-hidden" hideClose>
          <DialogTitle className="sr-only">{m.home_profile_badge_title()}</DialogTitle>
          <DialogDescription className="sr-only">
            {m.home_profile_badge_description()}
          </DialogDescription>

          <div className="px-6 pt-6 pb-5">
            <div className="flex items-center gap-3">
              <UserInitials name={userName} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">{userName}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              </div>
              <PlanBadge plan={plan} />
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="grid grid-cols-2 gap-4 px-6 py-5">
            <StatCell
              value={formatCompactNumber(totalWords)}
              label={m.home_profile_badge_stat_words()}
              index={0}
            />
            <StatCell
              value={formatDuration(totalDuration)}
              label={m.home_profile_badge_stat_duration()}
              index={1}
            />
            <StatCell
              value={formatCompactNumber(totalTranscriptions)}
              label={m.home_profile_badge_stat_transcriptions()}
              index={2}
            />
            <StatCell
              value={formatCompactNumber(wordsThisWeek)}
              label={m.home_profile_badge_stat_this_week()}
              index={3}
            />
          </div>

          <div className="border-t border-border" />

          <div className="px-6 py-3">
            <button
              type="button"
              onClick={() => setShareOpen(true)}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-md px-4 text-sm
              font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Share2 className="size-4" aria-hidden />
              Compartilhar status
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ShareCardModal open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
