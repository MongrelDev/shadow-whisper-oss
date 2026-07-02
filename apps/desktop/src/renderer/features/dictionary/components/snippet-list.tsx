import { Plus, X, ArrowRight } from "lucide-react";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { useSnippetMutations } from "@/hooks/use-snippets";

function EmptySection({ onAdd }: { onAdd: () => void }): React.ReactElement {
  return (
    <div className="py-10 text-center">
      <p className="text-base text-muted-foreground">{m.dictionary_snippet_empty_title()}</p>
      <p className="text-sm text-muted-foreground/70 mt-1">
        {m.dictionary_snippet_empty_subtitle()}
      </p>
      <Button variant="outline" size="sm" className="mt-5 gap-2 text-sm" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        {m.dictionary_button_add_snippet()}
      </Button>
    </div>
  );
}

interface SnippetListProps {
  snippets: Snippet[];
  mutations: ReturnType<typeof useSnippetMutations>;
  onAdd: () => void;
}

export function SnippetList({ snippets, mutations, onAdd }: SnippetListProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {m.dictionary_snippet_title()}
          </h2>
          {snippets.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">
              {snippets.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-sm h-9" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          {m.dictionary_button_add()}
        </Button>
      </div>

      {snippets.length === 0 ? (
        <EmptySection onAdd={onAdd} />
      ) : (
        <div className="space-y-0.5">
          {snippets.map((snippet) => (
            <div
              key={snippet.id}
              className={cn(
                "group flex items-center justify-between px-4 py-3 -mx-2 rounded-xl",
                "hover:bg-accent/50 transition-colors"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-muted-foreground font-mono text-sm bg-muted px-2.5 py-1 rounded-lg shrink-0">
                  {snippet.triggerPhrase}
                </span>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                <span className="text-base text-foreground font-medium line-clamp-2 min-w-0">
                  {snippet.expandedText}
                </span>
              </div>
              <button
                onClick={() => mutations.removeSnippet.mutate(snippet.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-destructive/10 shrink-0 ml-3"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
