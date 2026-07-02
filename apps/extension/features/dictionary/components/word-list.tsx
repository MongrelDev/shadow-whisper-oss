import { Plus, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import type { DictionaryWord } from "../hooks/use-dictionary";
import type { DictionaryMutations } from "../hooks/use-dictionary-mutations";

function WordEmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-muted-foreground">{m.dictionary_words_empty()}</p>
      <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
        {m.dictionary_words_empty_hint()}
      </p>
      <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onAdd}>
        <Plus className="size-4" />
        {m.dictionary_add_word()}
      </Button>
    </div>
  );
}

function WordRow({ word, onRemove }: { word: DictionaryWord; onRemove: (id: number) => void }) {
  return (
    <li
      className={cn(
        "group flex items-center justify-between px-3 py-2.5 rounded-lg",
        "hover:bg-accent/50 transition-colors"
      )}
    >
      <span className="text-sm font-medium text-foreground">{word.word}</span>
      <button
        type="button"
        onClick={() => onRemove(word.id)}
        className="flex size-10 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:bg-destructive/10 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={m.dictionary_action_delete()}
      >
        <X className="size-4 text-muted-foreground hover:text-destructive transition-colors" />
      </button>
    </li>
  );
}

interface WordListProps {
  words: readonly DictionaryWord[];
  mutations: DictionaryMutations;
  onAdd: () => void;
}

export function WordList({ words, mutations, onAdd }: WordListProps): React.ReactElement {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-medium text-muted-foreground">
          {words.length}{" "}
          {words.length === 1 ? m.dictionary_word_singular() : m.dictionary_word_plural()}
        </span>
        <Button variant="ghost" size="sm" className="gap-1.5 h-9" onClick={onAdd}>
          <Plus className="size-4" />
          {m.dictionary_add_word()}
        </Button>
      </div>
      {words.length === 0 ? (
        <WordEmptyState onAdd={onAdd} />
      ) : (
        <ul role="list" className="space-y-0.5 px-2 pb-2">
          {words.map((word) => (
            <WordRow key={word.id} word={word} onRemove={mutations.removeWord.mutate} />
          ))}
        </ul>
      )}
    </div>
  );
}
