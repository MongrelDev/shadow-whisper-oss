import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { m } from "~/paraglide/messages";
import { AddSnippetModal } from "../components/add-snippet-modal";
import { AddWordModal } from "../components/add-word-modal";
import { SnippetList } from "../components/snippet-list";
import { WordList } from "../components/word-list";
import { useDictionary, type Dictionary } from "../hooks/use-dictionary";
import {
  useDictionaryMutations,
  type DictionaryMutations,
} from "../hooks/use-dictionary-mutations";

function LoadingState(): React.ReactElement {
  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="space-y-2">
        <div className="h-7 w-32 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-48 animate-pulse rounded-md bg-muted/60" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-1 pt-2">
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
        <div className="h-10 animate-pulse rounded-lg bg-muted/50" />
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-sm text-destructive">{message}</p>
    </div>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function DictionaryContent({
  data,
  mutations,
}: {
  data: Dictionary | undefined;
  mutations: DictionaryMutations;
}): React.ReactElement {
  const [wordModalOpen, setWordModalOpen] = useState(false);
  const [snippetModalOpen, setSnippetModalOpen] = useState(false);

  const words = data?.words ?? [];
  const snippets = data?.snippets ?? [];

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <header>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">
          {m.dictionary_title()}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{m.dictionary_subtitle()}</p>
      </header>

      <Tabs defaultValue="words" className="flex flex-1 flex-col gap-3">
        <TabsList className="self-start">
          <TabsTrigger value="words">{m.dictionary_tab_words()}</TabsTrigger>
          <TabsTrigger value="snippets">{m.dictionary_tab_snippets()}</TabsTrigger>
        </TabsList>

        <TabsContent value="words" className="mt-0">
          <WordList words={words} mutations={mutations} onAdd={() => setWordModalOpen(true)} />
        </TabsContent>

        <TabsContent value="snippets" className="mt-0">
          <SnippetList
            snippets={snippets}
            mutations={mutations}
            onAdd={() => setSnippetModalOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <AddWordModal open={wordModalOpen} onOpenChange={setWordModalOpen} mutations={mutations} />
      <AddSnippetModal
        open={snippetModalOpen}
        onOpenChange={setSnippetModalOpen}
        mutations={mutations}
      />
    </div>
  );
}

export function DictionaryPage(): React.ReactElement {
  const { data, isLoading, isError, error } = useDictionary();
  const mutations = useDictionaryMutations();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message={errorMessage(error)} />;
  return <DictionaryContent data={data} mutations={mutations} />;
}
