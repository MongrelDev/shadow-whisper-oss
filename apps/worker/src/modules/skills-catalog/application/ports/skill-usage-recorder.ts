import { Context, Effect } from "effect";
import type { SkillUsageRecordError } from "../../errors";

export interface SkillUsageInput {
  skillId: string;
  skillVersion: number;
  inputWordCount: number;
  outputWordCount: number;
  durationMs: number;
  success: boolean;
  bundleId?: string;
  siteHost?: string;
  surfaceContext?: string;
  platform: "desktop" | "extension";
  os: string;
  language: string | null;
  timezone: string;
}

export interface SkillUsageRecorderService {
  readonly record: (
    userId: string,
    input: SkillUsageInput
  ) => Effect.Effect<void, SkillUsageRecordError>;
}

export class SkillUsageRecorder extends Context.Service<
  SkillUsageRecorder,
  SkillUsageRecorderService
>()("SkillUsageRecorder") {}
