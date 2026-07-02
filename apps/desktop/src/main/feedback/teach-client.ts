import type { IngestTeachBody } from "@whisper/api";
import { typedRequest } from "../ipc/api-client";

export interface AutoEditTeachPayload {
  selectedText: string;
  lastTranscriptionText: string;
  candidates: ReadonlyArray<{ from: string; to: string }>;
}

export async function postAutoEditTeach(payload: AutoEditTeachPayload): Promise<void> {
  const body: IngestTeachBody = {
    selectedText: payload.selectedText,
    lastTranscriptionText: payload.lastTranscriptionText,
    source: "auto-edit",
    candidates: payload.candidates.map((c) => ({ from: c.from, to: c.to })),
  };
  const result = await typedRequest((c) => c.teach.$post({ json: body }));
  if (!result.success) {
    throw new Error(`teach POST failed: ${result.error ?? "unknown"}`);
  }
}
