import { Schema } from "effect";

const SafeString = Schema.String.check(Schema.isMaxLength(512));
const OptionalSafeString = Schema.optional(SafeString);

const CommonFields = {
  sessionId: SafeString,
  subjectType: Schema.Literals(["user", "guest"]),
  subjectId: SafeString,
  surface: Schema.Literals(["desktop", "extension", "web"]),
  issuedAt: Schema.Number,
  hostname: OptionalSafeString,
  language: OptionalSafeString,
  timezone: OptionalSafeString,
  platform: OptionalSafeString,
  os: OptionalSafeString,
};

export const NativeAppWarmupMetadata = Schema.Struct({
  ...CommonFields,
  surface: Schema.Literal("desktop"),
  bundleId: OptionalSafeString,
  activeTabHost: OptionalSafeString,
  accessibilityTrusted: Schema.optional(Schema.Boolean),
  focusedAppName: OptionalSafeString,
  focusedAppBundleId: OptionalSafeString,
  rawSafeBag: Schema.optional(Schema.Record(SafeString, Schema.Unknown)),
});
export type NativeAppWarmupMetadata = typeof NativeAppWarmupMetadata.Type;

export const ExtensionWarmupMetadata = Schema.Struct({
  ...CommonFields,
  surface: Schema.Literal("extension"),
  bundleId: OptionalSafeString,
  activeTabHost: OptionalSafeString,
  browser: OptionalSafeString,
  rawSafeBag: Schema.optional(Schema.Record(SafeString, Schema.Unknown)),
});
export type ExtensionWarmupMetadata = typeof ExtensionWarmupMetadata.Type;

export const GenericWarmupMetadata = Schema.Struct({
  ...CommonFields,
  surface: Schema.Literals(["desktop", "extension", "web"]),
  rawSafeBag: Schema.optional(Schema.Record(SafeString, Schema.Unknown)),
});
export type GenericWarmupMetadata = typeof GenericWarmupMetadata.Type;

export const WarmupMetadata = Schema.Union([
  NativeAppWarmupMetadata,
  ExtensionWarmupMetadata,
  GenericWarmupMetadata,
]);
export type WarmupMetadata = typeof WarmupMetadata.Type;

export const EMPTY_WARMUP_METADATA: GenericWarmupMetadata = {
  sessionId: "",
  subjectType: "user",
  subjectId: "",
  surface: "desktop",
  issuedAt: 0,
};
