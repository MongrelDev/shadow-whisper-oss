import { Plus, X } from "lucide-react";
import { m } from "~/paraglide/messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { useDictionaryMutations } from "@/hooks/use-dictionary";

function EmptySection({ onAdd }: { onAdd: () => void }): React.ReactElement {
  return (
    <div className="py-10 text-center">
      <p className="text-base text-muted-foreground">{m.dictionary_word_empty_title()}</p>
      <p className="text-sm text-muted-foreground/70 mt-1">{m.dictionary_word_empty_subtitle()}</p>
      <Button variant="outline" size="sm" className="mt-5 gap-2 text-sm" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        {m.dictionary_button_add_word()}
      </Button>
    </div>
  );
}

interface WordListProps {
  words: DictionaryWord[];
  mutations: ReturnType<typeof useDictionaryMutations>;
  onAdd: () => void;
}

export function WordList({ words, mutations, onAdd }: WordListProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {m.dictionary_word_title()}
          </h2>
          {words.length > 0 && (
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md tabular-nums">
              {words.length}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="gap-2 text-sm h-9" onClick={onAdd}>
          <Plus className="w-4 h-4" />
          {m.dictionary_button_add()}
        </Button>
      </div>

      {words.length === 0 ? (
        <EmptySection onAdd={onAdd} />
      ) : (
        <div className="space-y-0.5">
          {words.map((word) => (
            <div
              key={word.id}
              className={cn(
                "group flex items-center justify-between px-4 py-3 -mx-2 rounded-xl",
                "hover:bg-accent/50 transition-colors"
              )}
            >
              <span className="text-base text-foreground font-medium">{word.word}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                title={m.dictionary_button_remove()}
                onClick={() => mutations.removeWord.mutate(word.id)}
                className={cn(
                  "size-8 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                  "opacity-0 transition-opacity group-hover:opacity-100",
                  "group-focus-within:opacity-100 focus-visible:opacity-100"
                )}
              >
                <X className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
