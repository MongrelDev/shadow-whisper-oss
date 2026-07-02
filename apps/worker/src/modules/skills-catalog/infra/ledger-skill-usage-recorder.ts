import { Effect } from "effect";
import { SkillUsageRecordError } from "../errors";
import type { SkillUsageRecorderService } from "../application/ports/skill-usage-recorder";
import type { UsageLedgerServiceShape } from "../../usage/application/usage-ledger-service";

export const makeLedgerSkillUsageRecorder = (
  ledger: UsageLedgerServiceShape
): SkillUsageRecorderService => ({
  record: (userId, input) =>
    ledger
      .appendSkillUsage(userId, {
        skillId: input.skillId,
        skillVersion: input.skillVersion,
        inputWordCount: input.inputWordCount,
        outputWordCount: input.outputWordCount,
        durationMs: input.durationMs,
        success: input.success,
        ...(input.bundleId !== undefined ? { bundleId: input.bundleId } : {}),
        ...(input.siteHost !== undefined ? { siteHost: input.siteHost } : {}),
        ...(input.surfaceContext !== undefined ? { surfaceContext: input.surfaceContext } : {}),
        platform: input.platform,
        os: input.os,
        language: input.language,
        timezone: input.timezone,
      })
      .pipe(Effect.mapError((e) => new SkillUsageRecordError({ message: e.message }))),
});
