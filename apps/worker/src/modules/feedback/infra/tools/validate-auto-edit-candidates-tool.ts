import { jsonSchema, tool } from "ai";

export interface AcceptedPair {
  readonly from: string;
  readonly to: string;
  readonly context: string;
}

export interface ValidateAutoEditCandidatesInput {
  readonly accepted: ReadonlyArray<AcceptedPair>;
}

export interface ValidateAutoEditCandidatesOutput {
  readonly accepted: ReadonlyArray<AcceptedPair>;
}

export const makeValidateAutoEditCandidatesTool = () =>
  tool({
    description:
      "Report which candidate transcription corrections you accept as phonetic or orthographic fixes of real words. Call this tool ONCE with all accepted pairs. Reject stylistic rewrites, common-word swaps, and credential or PII fragments. Provide a short neutral context tag for each accepted pair.",
    inputSchema: jsonSchema<ValidateAutoEditCandidatesInput>({
      type: "object",
      properties: {
        accepted: {
          type: "array",
          maxItems: 20,
          items: {
            type: "object",
            properties: {
              from: {
                type: "string",
                description: "verbatim word from the user's original transcription",
              },
              to: {
                type: "string",
                description: "verbatim word from the user's edited text",
              },
              context: {
                type: "string",
                description:
                  "concise tag for the corrected term, e.g. 'tech term', 'proper name', 'company acronym', 'foreign word'",
                maxLength: 80,
              },
            },
            required: ["from", "to", "context"],
            additionalProperties: false,
          },
        },
      },
      required: ["accepted"],
      additionalProperties: false,
    }),
    execute: async ({ accepted }): Promise<ValidateAutoEditCandidatesOutput> => {
      return { accepted };
    },
  });
