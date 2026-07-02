import { Effect } from "effect";
import type {
  GenerateTextRequest,
  TextGeneratorService,
} from "../application/ports/text-generator";

export const makeFallbackTextGenerator = (
  primary: TextGeneratorService,
  fallback: TextGeneratorService
): TextGeneratorService => ({
  generate: (req: GenerateTextRequest) =>
    primary.generate(req).pipe(
      Effect.catch((error) =>
        error.retryable === false
          ? Effect.fail(error)
          : Effect.logWarning("Primary LLM failed, falling back", {
              error: error.message,
            }).pipe(Effect.andThen(fallback.generate(req)))
      )
    ),
});
