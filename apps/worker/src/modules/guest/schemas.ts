import { Schema } from "effect";

export const TransformDemoRequest = Schema.Struct({
  text: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(5000)),
  skillId: Schema.String.check(Schema.isMinLength(1)),
  locale: Schema.optional(Schema.String),
});
export type TransformDemoRequest = typeof TransformDemoRequest.Type;

export type TranscribeDemoResponse = {
  rawText: string;
  cleanText: string;
  durationMs: number;
};

export type StartJobResponse = {
  jobId: string;
  agentId: string;
};

export type TransformDemoResponse = {
  resultText: string;
  skillId: string;
};

export type DemoSkillsResponse = {
  transformers: Array<{ id: string; label: string; description: string }>;
};
