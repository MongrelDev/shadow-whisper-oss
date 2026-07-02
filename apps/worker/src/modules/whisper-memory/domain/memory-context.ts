export interface MemoryDictionaryEntry {
  readonly source: string;
  readonly replacement: string;
}

export interface MemoryStyleNote {
  readonly note: string;
  readonly examples: ReadonlyArray<{ readonly from: string; readonly to: string }>;
}

export interface MemoryContext {
  readonly dictionary: ReadonlyArray<MemoryDictionaryEntry>;
  readonly styleNotes: ReadonlyArray<MemoryStyleNote>;
}

export const EMPTY_MEMORY_CONTEXT: MemoryContext = {
  dictionary: [],
  styleNotes: [],
};
