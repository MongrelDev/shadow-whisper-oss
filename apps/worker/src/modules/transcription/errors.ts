import { Data } from "effect";

export class AppCategoryError extends Data.TaggedError("AppCategoryError")<{
  readonly message: string;
}> {}
