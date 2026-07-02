import { Effect } from "effect";
import { sql, type DrizzleDatabase } from "@whisper/db";
import type {
  AppCategoryRepositoryService,
  ResolveAppCategoryInput,
} from "../application/ports/app-category-repository";
import type { AppRegistryEntry } from "../domain/app-category";
import { isAppCategory } from "../domain/app-category";
import { AppCategoryError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

interface ResolveRow {
  host_name: string;
  category: string;
}

const selectAppByIdentifier = (db: DrizzleDatabase, identifier: string) =>
  Effect.tryPromise({
    try: async () => {
      const rows = (await db.all(
        sql`
          SELECT host_name, category FROM app_registry
          WHERE identifier = ${identifier}
          LIMIT 1
        `
      )) as ResolveRow[];
      return rows[0] ?? null;
    },
    catch: (e) => new AppCategoryError({ message: unknownMessage(e) }),
  });

const selectSiteByHost = (db: DrizzleDatabase, host: string) =>
  Effect.tryPromise({
    try: async () => {
      const rows = (await db.all(
        sql`
          SELECT host_name, category FROM app_host_registry
          WHERE host = ${host}
          LIMIT 1
        `
      )) as ResolveRow[];
      return rows[0] ?? null;
    },
    catch: (e) => new AppCategoryError({ message: unknownMessage(e) }),
  });

const toEntry = (row: ResolveRow | null): AppRegistryEntry | null => {
  if (!row) return null;
  if (!isAppCategory(row.category)) return null;
  return { hostName: row.host_name, category: row.category };
};

export const makeD1AppCategoryRepository = (db: DrizzleDatabase): AppCategoryRepositoryService => ({
  resolve: Effect.fnUntraced(function* (input: ResolveAppCategoryInput) {
    const bundleId = input.bundleId.trim().toLowerCase();
    const host = input.host?.trim().toLowerCase() ?? "";

    // The website takes priority over the app: if the request carries a host that we
    // recognize, that site's category wins. An unrecognized host (or none) falls back
    // to the focused app's own category. A stray host from a non-browser app is
    // naturally contained — it simply won't be in app_host_registry.
    if (host) {
      const siteEntry = toEntry(yield* selectSiteByHost(db, host));
      if (siteEntry) return siteEntry;
    }

    return bundleId ? toEntry(yield* selectAppByIdentifier(db, bundleId)) : null;
  }),
});
