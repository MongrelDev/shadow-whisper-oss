import { Data } from "effect";

export class UsageTrackerError extends Data.TaggedError("UsageTrackerError")<{
  readonly message: string;
}> {}

export class AppRegistryCandidatesError extends Data.TaggedError("AppRegistryCandidatesError")<{
  readonly message: string;
}> {}

export class UsageLedgerReaderError extends Data.TaggedError("UsageLedgerReaderError")<{
  readonly message: string;
}> {}

export class UsageStatsReaderError extends Data.TaggedError("UsageStatsReaderError")<{
  readonly message: string;
}> {}

export class UsageLedgerStorageError extends Data.TaggedError("UsageLedgerStorageError")<{
  readonly op: string;
  readonly message: string;
}> {}
