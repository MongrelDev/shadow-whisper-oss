import { Effect } from "effect";
import type { AppCategoryRepositoryService } from "../../transcription/application/ports/app-category-repository";
import type { AppRegistryEntry } from "../../transcription/domain/app-category";

export interface AppIdentifierSource {
  readonly bundleId: string | null;
  readonly siteHost: string | null;
}

const normalize = (value: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
};

// Both identifiers are carried in one key (bundle + host, newline-separated) so the
// registry can apply site-first resolution: a recognized host wins, otherwise the
// companion bundleId's app category is used.
export const identifierKeyOf = (row: AppIdentifierSource): string | null => {
  const host = normalize(row.siteHost);
  const bundle = normalize(row.bundleId);
  if (!host && !bundle) return null;
  return `${bundle ?? ""}\n${host ?? ""}`;
};

export const collectIdentifierKeys = (
  rows: ReadonlyArray<AppIdentifierSource>
): ReadonlyArray<string> => {
  const set = new Set<string>();
  for (const row of rows) {
    const key = identifierKeyOf(row);
    if (key) set.add(key);
  }
  return Array.from(set);
};

export const resolveIdentifiers = Effect.fnUntraced(function* (
  registry: AppCategoryRepositoryService,
  keys: ReadonlyArray<string>
) {
  const resolved = new Map<string, AppRegistryEntry | null>();
  yield* Effect.forEach(
    keys,
    (key) =>
      Effect.gen(function* () {
        const [bundle, host] = key.split("\n");
        const hit = yield* registry.resolve({
          bundleId: bundle ?? "",
          host: host && host.length > 0 ? host : null,
        });
        resolved.set(key, hit);
      }),
    { concurrency: 10 }
  );
  return resolved;
});
