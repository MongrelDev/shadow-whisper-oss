export const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length;
