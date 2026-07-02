import { Effect, Schema } from "effect";

const SourceSchema = Schema.Literals(["manual", "auto-edit"]);

export const CandidatePairSchema = Schema.Struct({
  from: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)),
  to: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)),
});
export type CandidatePair = typeof CandidatePairSchema.Type;

const TeachBodyStruct = Schema.Struct({
  selectedText: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2048)),
  lastTranscriptionText: Schema.NullOr(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(4096))
  ),
  source: SourceSchema.pipe(Schema.withDecodingDefaultType(Effect.succeed("manual" as const))),
  candidates: Schema.optional(Schema.Array(CandidatePairSchema).check(Schema.isMaxLength(20))),
});

export const TeachBodySchema = TeachBodyStruct.check(
  Schema.makeFilter((val) => {
    if (val.source !== "auto-edit") return true;
    if (!val.lastTranscriptionText) {
      return {
        path: ["lastTranscriptionText"],
        issue: "required when source is auto-edit",
      };
    }
    if (!val.candidates || val.candidates.length === 0) {
      return {
        path: ["candidates"],
        issue: "must contain at least one candidate when source is auto-edit",
      };
    }
    return true;
  })
);
export type TeachBody = typeof TeachBodySchema.Type;
