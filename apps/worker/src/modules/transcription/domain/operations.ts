import type { AppCategory } from "./app-category";

// A transcript operation is an intentful transformation the intent router can apply
// instead of plain cleanup. The markdown body lives in the bundled skill repository
// under `skillKey`; only `label`/`when` are surfaced to the model in the catalog.
export interface TranscriptOperation {
  readonly id: string;
  readonly label: string;
  readonly when: string;
  readonly skillKey: string;
}

export const TRANSCRIPT_OPERATIONS: readonly TranscriptOperation[] = [
  {
    id: "bullet-list",
    label: "Bullet list",
    when: "the speaker is enumerating discrete items, options, or points and a list reads clearer than prose",
    skillKey: "operations/bullet-list.md",
  },
  {
    id: "numbered-list",
    label: "Numbered list",
    when: "the speaker is dictating an ordered sequence — steps, instructions, or a ranking where order matters",
    skillKey: "operations/numbered-list.md",
  },
  {
    id: "compose-email",
    label: "Compose email",
    when: "the speaker is drafting an email, reply, update, request, or announcement and wants it structured as a sendable email",
    skillKey: "operations/compose-email.md",
  },
  {
    id: "compose-message",
    label: "Compose message",
    when: "the speaker is writing a short chat or direct message and wants natural chat phrasing, not a polished email",
    skillKey: "operations/compose-message.md",
  },
  {
    id: "sales",
    label: "Sales / pitch",
    when: "the speaker is selling, pitching, or persuading and wants the text to land more persuasively",
    skillKey: "operations/sales.md",
  },
  {
    id: "note",
    label: "Note",
    when: "the speaker is capturing a note, reminder, or small to-do list for themselves",
    skillKey: "operations/note.md",
  },
];

const OPERATION_BY_ID: ReadonlyMap<string, TranscriptOperation> = new Map(
  TRANSCRIPT_OPERATIONS.map((op) => [op.id, op])
);

export const getOperation = (id: string): TranscriptOperation | null =>
  OPERATION_BY_ID.get(id) ?? null;

// Soft default the surface implies. The model may still pick a different operation
// or fall back to faithful cleanup — this only nudges the obvious case (an email app
// usually means an email, a notes app usually means a note).
const CATEGORY_OPERATION_HINT: Partial<Record<AppCategory, string>> = {
  email: "compose-email",
  messaging: "compose-message",
  social: "compose-message",
  notes: "note",
};

export const suggestedOperationForCategory = (category: AppCategory | null): string | null =>
  category ? (CATEGORY_OPERATION_HINT[category] ?? null) : null;
