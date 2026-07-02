let lastTranscriptText: string | null = null;

export function getLastTranscriptText(): string | null {
  return lastTranscriptText;
}

export function setLastTranscriptText(text: string): void {
  lastTranscriptText = text;
}
