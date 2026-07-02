export const unknownMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
