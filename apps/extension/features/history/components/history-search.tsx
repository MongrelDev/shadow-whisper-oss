import { Search, X } from "lucide-react";
import { m } from "~/paraglide/messages";

interface HistorySearchProps {
  query: string;
  setQuery: (value: string) => void;
}

export function HistorySearch({ query, setQuery }: HistorySearchProps): React.ReactElement {
  return (
    <div className="relative flex items-center border-b border-border/50 px-4 py-2">
      <Search className="absolute left-7 size-3.5 text-muted-foreground/50" strokeWidth={2} />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={m.history_search_placeholder()}
        className="w-full rounded-md border border-border/60 bg-muted/30 py-1.5 pl-8 pr-8 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
      />
      {query.length > 0 && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="absolute right-7 flex size-4 items-center justify-center rounded-sm text-muted-foreground/50 hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
