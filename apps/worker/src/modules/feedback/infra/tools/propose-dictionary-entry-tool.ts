import { jsonSchema, tool } from "ai";

export interface ProposedPair {
  readonly from: string;
  readonly to: string;
  readonly context: string;
}

export interface ProposeDictionaryEntryInput {
  readonly pairs: ReadonlyArray<ProposedPair>;
}

export interface ProposeDictionaryEntryOutput {
  readonly accepted: true;
  readonly pairs: ReadonlyArray<ProposedPair>;
}

export const makeProposeDictionaryEntryTool = () =>
  tool({
    description:
      "Propose adding one or more dictionary substitutions detected in the user's correction. Each pair maps a misrecognized token (from) to the user's corrected token (to), with a short context phrase showing where the substitution occurred.",
    inputSchema: jsonSchema<ProposeDictionaryEntryInput>({
      type: "object",
      properties: {
        pairs: {
          type: "array",
          minItems: 1,
          items: {
            type: "object",
            properties: {
              from: { type: "string", minLength: 1 },
              to: { type: "string", minLength: 1 },
              context: { type: "string" },
            },
            required: ["from", "to", "context"],
            additionalProperties: false,
          },
        },
      },
      required: ["pairs"],
      additionalProperties: false,
    }),
    execute: async ({ pairs }): Promise<ProposeDictionaryEntryOutput> => {
      return { accepted: true, pairs };
    },
  });
