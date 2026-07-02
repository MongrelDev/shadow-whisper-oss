import { Mic } from "lucide-react";
import { useExtensionHistory } from "~/features/history/hooks/use-extension-history";
import { useHistorySearch } from "../hooks/use-history-search";
import { HistorySearch } from "./history-search";
import { HistoryItem } from "./history-item";
import type { ExtensionHistoryEntry } from "../lib/history-storage";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

interface GroupedHistory {
  today: ExtensionHistoryEntry[];
  yesterday: ExtensionHistoryEntry[];
  thisWeek: ExtensionHistoryEntry[];
  older: ExtensionHistoryEntry[];
}

function groupByDate(entries: ExtensionHistoryEntry[]): GroupedHistory {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);

  const today: ExtensionHistoryEntry[] = [];
  const yesterday: ExtensionHistoryEntry[] = [];
  const thisWeek: ExtensionHistoryEntry[] = [];
  const older: ExtensionHistoryEntry[] = [];

  for (const entry of entries) {
    const date = new Date(entry.createdAt);
    if (date >= todayStart) today.push(entry);
    else if (date >= yesterdayStart) yesterday.push(entry);
    else if (date >= weekStart) thisWeek.push(entry);
    else older.push(entry);
  }

  return { today, yesterday, thisWeek, older };
}

function SectionDivider({ label, count }: { label: string; count: number }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 border-y border-border/50 bg-muted/30 px-4 py-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <span className="h-px flex-1 bg-border/40" aria-hidden="true" />
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">{count}</span>
    </div>
  );
}

function EmptyState(): React.ReactElement {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-6 py-12 text-center">
      <Mic className="mx-auto mb-4 size-6 text-muted-foreground/30" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">{m.history_empty_title()}</p>
      <p className="mx-auto mt-2 max-w-56 text-xs leading-relaxed text-muted-foreground">
        {m.history_empty_subtitle()}
      </p>
    </div>
  );
}

function Section({
  label,
  items,
}: {
  label: string;
  items: ExtensionHistoryEntry[];
}): React.ReactElement {
  return (
    <section>
      <SectionDivider label={label} count={items.length} />
      <ul className="divide-y divide-border/50">
        {items.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </section>
  );
}

function SearchEmptyState({ query }: { query: string }): React.ReactElement {
  return (
    <div className="px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">{m.history_search_empty({ query })}</p>
    </div>
  );
}

function FilteredList({ entries }: { entries: ExtensionHistoryEntry[] }): React.ReactElement {
  return (
    <div>
      <SectionDivider label="Results" count={entries.length} />
      <ul className="divide-y divide-border/50">
        {entries.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </ul>
    </div>
  );
}

function GroupedList({ entries }: { entries: ExtensionHistoryEntry[] }): React.ReactElement {
  const grouped = groupByDate(entries);
  const sections = [
    { label: m.history_section_today(), items: grouped.today },
    { label: m.history_section_yesterday(), items: grouped.yesterday },
    { label: m.history_section_this_week(), items: grouped.thisWeek },
    { label: m.history_section_older(), items: grouped.older },
  ].filter((s) => s.items.length > 0);

  return (
    <div>
      {sections.map((section) => (
        <Section key={section.label} label={section.label} items={section.items} />
      ))}
    </div>
  );
}

function formatCount(count: number): string {
  return count === 1
    ? `1 ${m.history_item_count_singular()}`
    : `${count} ${m.history_item_count_plural()}`;
}

interface HistoryBodyProps {
  history: ExtensionHistoryEntry[];
  filtered: ExtensionHistoryEntry[];
  query: string;
  isFiltering: boolean;
}

function HistoryBody({
  history,
  filtered,
  query,
  isFiltering,
}: HistoryBodyProps): React.ReactElement {
  if (history.length === 0) return <EmptyState />;
  if (isFiltering && filtered.length === 0) return <SearchEmptyState query={query} />;
  if (isFiltering) return <FilteredList entries={filtered} />;
  return <GroupedList entries={history} />;
}

export function HistoryList(): React.ReactElement {
  const history = useExtensionHistory();
  const { query, setQuery, filtered, isFiltering } = useHistorySearch(history);
  const countLabel = isFiltering ? formatCount(filtered.length) : formatCount(history.length);

  return (
    <section className={cn("overflow-hidden rounded-lg border border-border/60 bg-card")}>
      <header className="flex items-center justify-between border-b border-border/50 px-4 py-2.5">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {m.history_title()}
        </h2>
        <p className="font-mono text-[11px] tabular-nums text-muted-foreground/70">{countLabel}</p>
      </header>
      <HistorySearch query={query} setQuery={setQuery} />
      <HistoryBody history={history} filtered={filtered} query={query} isFiltering={isFiltering} />
    </section>
  );
}
