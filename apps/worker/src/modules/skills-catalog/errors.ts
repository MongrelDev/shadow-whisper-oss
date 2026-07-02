import { Data } from "effect";

export class SkillNotFoundError extends Data.TaggedError("SkillNotFoundError")<{
  readonly id: string;
}> {}

export class SkillDatabaseError extends Data.TaggedError("SkillDatabaseError")<{
  readonly message: string;
}> {}

export class SkillValidationError extends Data.TaggedError("SkillValidationError")<{
  readonly field: string;
  readonly message: string;
}> {}

export class SkillExecutionError extends Data.TaggedError("SkillExecutionError")<{
  readonly message: string;
}> {}

export class SkillInstallationError extends Data.TaggedError("SkillInstallationError")<{
  readonly message: string;
}> {}

export class SkillSyncExecutionError extends Data.TaggedError("SkillSyncExecutionError")<{
  readonly message: string;
}> {}

export class SkillUsageRecordError extends Data.TaggedError("SkillUsageRecordError")<{
  readonly message: string;
}> {}
