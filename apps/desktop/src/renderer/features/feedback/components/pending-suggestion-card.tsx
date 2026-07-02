import { ArrowRight } from "lucide-react";
import { m } from "~/paraglide/messages";
import { AsyncButton } from "@/components/ui/async-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import type { PendingSuggestion } from "../types/pending-suggestion";

interface PendingSuggestionCardProps {
  suggestion: PendingSuggestion;
  onAccept: () => void;
  onReject: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
}

function formatRelative(timestamp: number): string {
  const diffSec = Math.round((timestamp - Date.now()) / 1000);
  const fmt = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return fmt.format(diffSec, "second");
  if (abs < 3600) return fmt.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return fmt.format(Math.round(diffSec / 3600), "hour");
  return fmt.format(Math.round(diffSec / 86400), "day");
}

export function PendingSuggestionCard({
  suggestion,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
}: PendingSuggestionCardProps): React.ReactElement {
  const { original, replacement, context } = suggestion;
  const disabled = isAccepting || isRejecting;

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-center gap-2 text-sm">
          <span className="line-through text-muted-foreground truncate">{original}</span>
          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium truncate">{replacement}</span>
          <span className="ml-auto shrink-0 text-xs text-muted-foreground">
            {formatRelative(suggestion.createdAt)}
          </span>
        </div>
        {context && <p className="text-xs text-muted-foreground line-clamp-2">{context}</p>}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onReject} disabled={disabled}>
          {m.feedback_card_reject()}
        </Button>
        <AsyncButton
          size="sm"
          onClick={onAccept}
          isPending={isAccepting}
          pendingLabel={m.feedback_card_accept()}
          disabled={disabled}
        >
          {m.feedback_card_accept()}
        </AsyncButton>
      </CardFooter>
    </Card>
  );
}
