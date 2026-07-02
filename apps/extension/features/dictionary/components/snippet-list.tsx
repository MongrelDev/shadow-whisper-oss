import { ArrowRight, Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import type { Snippet } from "../hooks/use-dictionary";
import type { DictionaryMutations } from "../hooks/use-dictionary-mutations";

function SnippetEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted-foreground">{m.dictionary_snippets_empty()}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
        {m.dictionary_snippets_empty_hint()}
      </p>
      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onAdd}>
        <Plus className="size-4" />
        {m.dictionary_add_snippet()}
      </Button>
    </div>
  );
}

function SnippetRow({ snippet, onRemove }: { snippet: Snippet; onRemove: (id: number) => void }) {
  return (
    <li
      className={cn(
        "group flex items-start justify-between gap-3 px-3 py-3 rounded-lg",
        "hover:bg-accent/50 transition-colors"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded shrink-0">
          {snippet.triggerPhrase}
        </span>
        <ArrowRight className="size-3 text-muted-foreground/40 shrink-0 mt-0.5" />
        <span className="text-sm text-foreground line-clamp-2 min-w-0">{snippet.expandedText}</span>
      </div>
      <button
        type="button"
        onClick={() => onRemove(snippet.id)}
        className="flex size-10 shrink-0 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-destructive/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={m.dictionary_action_delete()}
      >
        <X className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
      </button>
    </li>
  );
}

interface SnippetListProps {
  snippets: readonly Snippet[];
  mutations: DictionaryMutations;
  onAdd: () => void;
}

export function SnippetList({ snippets, mutations, onAdd }: SnippetListProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {snippets.length}{" "}
          {snippets.length === 1 ? m.dictionary_snippet_singular() : m.dictionary_snippet_plural()}
        </span>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9" onClick={onAdd}>
          <Plus className="size-4" />
          {m.dictionary_add_snippet()}
        </Button>
      </div>
      {snippets.length === 0 ? (
        <SnippetEmptyState onAdd={onAdd} />
      ) : (
        <ul role="list" className="space-y-0.5 px-2 pb-2">
          {snippets.map((snippet) => (
            <SnippetRow
              key={snippet.id}
              snippet={snippet}
              onRemove={mutations.removeSnippet.mutate}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
