import { Mic } from "lucide-react";
import { m } from "~/paraglide/messages";
import { AudioPlayerProvider } from "@/components/ui/audio-player";
import { ShortcutKeys } from "@/components/ui/shortcut-keys";
import type { Transcription } from "@/lib/db";

interface GroupedHistory {
  today: Transcription[];
  yesterday: Transcription[];
  thisWeek: Transcription[];
  older: Transcription[];
  totalCount: number;
}

function groupByDate(entries: Transcription[]): GroupedHistory {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: Transcription[] = [];
  const yesterday: Transcription[] = [];
  const thisWeek: Transcription[] = [];
  const older: Transcription[] = [];

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    if (date >= todayStart) {
      today.push(entry);
    } else if (date >= yesterdayStart) {
      yesterday.push(entry);
    } else if (date >= weekStart) {
      thisWeek.push(entry);
    } else {
      older.push(entry);
    }
  }

  return { today, yesterday, thisWeek, older, totalCount: entries.length };
}

function sectionWordCount(items: Transcription[]): number {
  return items.reduce((sum, entry) => sum + (entry.wordCount ?? 0), 0);
}

function SectionDivider({
  label,
  count,
  wordCount,
}: {
  label: string;
  count: number;
  wordCount: number;
}): React.ReactElement {
  const countLabel =
    count === 1
      ? `${count} ${m.home_item_count_singular()}`
      : `${count} ${m.home_item_count_plural()}`;

  return (
    <div className="flex items-center gap-2.5 px-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
        {label} · {countLabel}
      </span>
      <span className="h-px flex-1 bg-border/40" aria-hidden="true" />
      {wordCount > 0 && (
        <span className="font-mono text-[10px] tabular-nums uppercase tracking-[0.16em] text-muted-foreground/50">
          {wordCount.toLocaleString()} {m.stats_words()}
        </span>
      )}
    </div>
  );
}

function Section({
  label,
  items,
  renderItem,
}: {
  label: string;
  items: Transcription[];
  renderItem: (entry: Transcription) => React.ReactElement;
}): React.ReactElement {
  return (
    <section>
      <SectionDivider label={label} count={items.length} wordCount={sectionWordCount(items)} />
      <ul className="divide-y divide-border/50">
        {items.map((entry) => (
          <li key={entry.id}>{renderItem(entry)}</li>
        ))}
      </ul>
    </section>
  );
}

function EmptyState({ recordAccelerator }: { recordAccelerator?: string }): React.ReactElement {
  return (
    <div className="relative mx-auto w-full" data-tour="home-history">
      <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            {m.home_history_title()}
          </p>
          <p className="font-mono text-[11px] text-muted-foreground/60">
            {m.home_empty_state_label()}
          </p>
        </div>
        <div className="px-6 py-16 text-center">
          <Mic className="mx-auto mb-4 size-6 text-muted-foreground/30" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">{m.home_empty_state_title()}</p>
          <div className="mx-auto mt-2 flex max-w-xs flex-wrap items-center justify-center gap-1.5 text-xs leading-relaxed text-muted-foreground">
            <span>{m.home_empty_state_subtitle_prefix()}</span>
            <ShortcutKeys accelerator={recordAccelerator ?? "CommandOrControl+Alt+W"} size="sm" />
            <span>{m.home_empty_state_subtitle_suffix()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingState(): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {m.home_history_title()}
        </p>
        <span className="h-2 w-8 animate-pulse rounded-full bg-muted" aria-hidden="true" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-4 px-4 py-4">
            <span className="h-3 w-10 animate-pulse rounded bg-muted" />
            <div className="flex-1 space-y-2">
              <span className="block h-3 w-[70%] animate-pulse rounded bg-muted" />
              <span className="block h-2 w-20 animate-pulse rounded bg-muted/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface HistoryListProps {
  history: Transcription[] | undefined;
  isLoading: boolean;
  renderItem: (entry: Transcription) => React.ReactElement;
  recordAccelerator?: string;
}

export function HistoryList({
  history,
  isLoading,
  renderItem,
  recordAccelerator,
}: HistoryListProps): React.ReactElement {
  if (isLoading) return <LoadingState />;

  const grouped = history ? groupByDate(history) : null;
  if (!grouped || grouped.totalCount === 0)
    return <EmptyState recordAccelerator={recordAccelerator} />;

  const sections = [
    { label: m.home_section_today(), items: grouped.today },
    { label: m.home_section_yesterday(), items: grouped.yesterday },
    { label: m.home_section_this_week(), items: grouped.thisWeek },
    { label: m.home_section_older(), items: grouped.older },
  ].filter((section) => section.items.length > 0);

  return (
    <AudioPlayerProvider>
      <section className="relative">
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div>
            {sections.map((section) => (
              <Section
                key={section.label}
                label={section.label}
                items={section.items}
                renderItem={renderItem}
              />
            ))}
          </div>
        </div>
      </section>
    </AudioPlayerProvider>
  );
}
