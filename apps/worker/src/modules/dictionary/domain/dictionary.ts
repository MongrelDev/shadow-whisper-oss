export interface DictionaryWord {
  readonly id: number;
  readonly word: string;
  readonly createdAt: number;
}

export interface Snippet {
  readonly id: number;
  readonly triggerPhrase: string;
  readonly expandedText: string;
  readonly createdAt: number;
}

export interface Dictionary {
  readonly words: readonly DictionaryWord[];
  readonly snippets: readonly Snippet[];
}
