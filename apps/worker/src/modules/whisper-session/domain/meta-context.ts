import type { GenericWarmupMetadata, WarmupMetadata } from "./warmup-metadata";

export interface MetaContext {
  readonly bundleId: string | null;
  readonly siteHost: string | null;
}

export const EMPTY_META_CONTEXT: MetaContext = { bundleId: null, siteHost: null };

export const resolveMetaContext = (meta: WarmupMetadata | GenericWarmupMetadata): MetaContext => ({
  bundleId: "bundleId" in meta && typeof meta.bundleId === "string" ? meta.bundleId : null,
  siteHost:
    "activeTabHost" in meta && typeof meta.activeTabHost === "string" ? meta.activeTabHost : null,
});
