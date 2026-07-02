import { Context, Effect } from "effect";
import type { AutoEditValidatorError } from "../../errors";

export interface AutoEditValidatorInput {
  readonly originalText: string;
  readonly editedText: string;
  readonly candidates: ReadonlyArray<{ readonly from: string; readonly to: string }>;
}

export interface AcceptedAutoEditPair {
  readonly from: string;
  readonly to: string;
  readonly context: string;
}

export interface AutoEditValidatorResult {
  readonly accepted: ReadonlyArray<AcceptedAutoEditPair>;
}

export interface AutoEditValidatorService {
  readonly validate: (
    input: AutoEditValidatorInput
  ) => Effect.Effect<AutoEditValidatorResult, AutoEditValidatorError>;
}

export class AutoEditValidator extends Context.Service<
  AutoEditValidator,
  AutoEditValidatorService
>()("AutoEditValidator") {}
