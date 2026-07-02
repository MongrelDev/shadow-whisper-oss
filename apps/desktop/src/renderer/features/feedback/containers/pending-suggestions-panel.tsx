import { m } from "~/paraglide/messages";
import { PendingSuggestionCard } from "../components/pending-suggestion-card";
import { usePendingSuggestions } from "../hooks/use-pending-suggestions";

export function PendingSuggestionsPanel(): React.ReactElement | null {
  const { suggestions, isLoading, accept, reject, isAccepting, isRejecting } =
    usePendingSuggestions();

  const sorted = [...suggestions].sort((a, b) => b.createdAt - a.createdAt);

  if (isLoading) return null;
  if (sorted.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-sm font-medium text-muted-foreground">{m.feedback_card_title()}</h2>
      <div className="flex flex-col gap-3">
        {sorted.map((s) => (
          <PendingSuggestionCard
            key={s.id}
            suggestion={s}
            onAccept={() => accept(s.id)}
            onReject={() => reject(s.id)}
            isAccepting={isAccepting}
            isRejecting={isRejecting}
          />
        ))}
      </div>
    </section>
  );
}
