import { useState } from "react";
import { m } from "~/paraglide/messages";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDictionary, useDictionaryMutations } from "@/hooks/use-dictionary";
import { useSnippetMutations } from "@/hooks/use-snippets";
import { WordList } from "../components/word-list";
import { SnippetList } from "../components/snippet-list";
import { AddWordModal } from "../components/add-word-modal";
import { AddSnippetModal } from "../components/add-snippet-modal";

function DictionaryLoadingState(): React.ReactElement {
  return (
    <div aria-busy="true" aria-label={m.dictionary_loading()}>
      <span className="block h-9 w-48 animate-pulse rounded-md bg-muted" />
      <span className="mt-3 block h-4 w-72 animate-pulse rounded bg-muted/70" />
      <span className="mt-6 block h-9 w-56 animate-pulse rounded-lg bg-muted" />
      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <span className="block h-4 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className="block h-5 w-[60%] animate-pulse rounded bg-muted/70" />
          ))}
        </div>
      </div>
    </div>
  );
}

function toEmptyFallback(
  data: ReturnType<typeof useDictionary>["data"]
): NonNullable<ReturnType<typeof useDictionary>["data"]> {
  return data ?? { words: [], snippets: [] };
}

function DictionaryTabs({
  dictionary,
  mutations,
  snippetMutations,
  onAddWord,
  onAddSnippet,
}: {
  dictionary: ReturnType<typeof useDictionary>["data"];
  mutations: ReturnType<typeof useDictionaryMutations>;
  snippetMutations: ReturnType<typeof useSnippetMutations>;
  onAddWord: () => void;
  onAddSnippet: () => void;
}): React.ReactElement {
  const normalized = toEmptyFallback(dictionary);

  return (
    <Tabs defaultValue="dictionary" className="mt-6">
      <TabsList>
        <TabsTrigger value="dictionary">{m.dictionary_tab_dictionary()}</TabsTrigger>
        <TabsTrigger value="snippets">{m.dictionary_tab_snippets()}</TabsTrigger>
      </TabsList>

      <DictionaryEntriesTab words={normalized.words} mutations={mutations} onAddWord={onAddWord} />
      <DictionarySnippetsTab
        snippets={normalized.snippets}
        snippetMutations={snippetMutations}
        onAddSnippet={onAddSnippet}
      />
    </Tabs>
  );
}

function DictionaryEntriesTab({
  words,
  mutations,
  onAddWord,
}: {
  words: NonNullable<ReturnType<typeof useDictionary>["data"]>["words"] | [];
  mutations: ReturnType<typeof useDictionaryMutations>;
  onAddWord: () => void;
}): React.ReactElement {
  return (
    <TabsContent value="dictionary" className="mt-6">
      <WordList words={words} mutations={mutations} onAdd={onAddWord} />
    </TabsContent>
  );
}

function DictionarySnippetsTab({
  snippets,
  snippetMutations,
  onAddSnippet,
}: {
  snippets: NonNullable<ReturnType<typeof useDictionary>["data"]>["snippets"] | [];
  snippetMutations: ReturnType<typeof useSnippetMutations>;
  onAddSnippet: () => void;
}): React.ReactElement {
  return (
    <TabsContent value="snippets" className="mt-6">
      <SnippetList snippets={snippets} mutations={snippetMutations} onAdd={onAddSnippet} />
    </TabsContent>
  );
}

export function DictionaryPage(): React.ReactElement {
  const { data: dictionary, isLoading } = useDictionary();
  const mutations = useDictionaryMutations();
  const snippetMutations = useSnippetMutations();

  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);

  if (isLoading) return <DictionaryLoadingState />;

  return (
    <main>
      <h1 className="text-3xl font-bold text-foreground tracking-tight">{m.dictionary_title()}</h1>
      <p className="text-base text-muted-foreground mt-2">{m.dictionary_subtitle()}</p>

      <DictionaryTabs
        dictionary={dictionary}
        mutations={mutations}
        snippetMutations={snippetMutations}
        onAddWord={() => setWordModalOpen(true)}
        onAddSnippet={() => setSnippetModalOpen(true)}
      />

      <AddWordModal open={wordModalOpen} onOpenChange={setWordModalOpen} mutations={mutations} />
      <AddSnippetModal
        open={snippetModalOpen}
        onOpenChange={setSnippetModalOpen}
        mutations={snippetMutations}
      />
    </main>
  );
}
