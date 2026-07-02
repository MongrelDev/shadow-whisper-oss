import { Effect } from "effect";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import { SkillInstallationError } from "../errors";
import type { SkillInstallationRepositoryService } from "../application/ports/skill-installation-repository";
import type { InstalledSkillSummary } from "../domain/installed-skill";
import { unknownMessage } from "../../../lib/unknown-message";

const wrapError = (e: unknown) => new SkillInstallationError({ message: unknownMessage(e) });

type Row = Record<string, unknown>;

const safeParseTriggers = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

export const makeD1SkillInstallationRepository = (
  sql: SqlClient
): SkillInstallationRepositoryService => ({
  install: ({ userId, skillId, displayName, description, slug }) =>
    sql`
      INSERT INTO installed_skills (user_id, skill_id, display_name, description, slug, installed_at)
      VALUES (${userId}, ${skillId}, ${displayName}, ${description}, ${slug}, ${Date.now()})
      ON CONFLICT (user_id, skill_id) DO NOTHING
    `.pipe(Effect.asVoid, Effect.mapError(wrapError)),

  uninstall: (userId, skillId) =>
    sql`
      DELETE FROM installed_skills WHERE user_id = ${userId} AND skill_id = ${skillId}
    `.pipe(Effect.asVoid, Effect.mapError(wrapError)),

  listInstalled: (userId) =>
    Effect.all(
      [
        sql`
          SELECT skill_id AS skillId, display_name AS displayName, description, slug,
            installed_at AS installedAt
          FROM installed_skills WHERE user_id = ${userId}
        `,
        sql`
          SELECT id, slug, display_name AS displayName, description, markdown, triggers,
            created_at AS createdAt
          FROM custom_skills WHERE user_id = ${userId}
        `,
      ],
      { concurrency: 2 }
    ).pipe(
      Effect.map(([officialRows, customRows]) => {
        const official = (officialRows as ReadonlyArray<Row>).map<InstalledSkillSummary>((row) => ({
          skillId: String(row.skillId),
          displayName: String(row.displayName),
          description: String(row.description),
          slug: String(row.slug),
          installedAt: Number(row.installedAt),
        }));
        const custom = (customRows as ReadonlyArray<Row>).map<InstalledSkillSummary>((row) => ({
          skillId: String(row.id),
          displayName: String(row.displayName),
          description: String(row.description),
          slug: String(row.slug),
          installedAt: Number(row.createdAt),
          markdown: String(row.markdown),
          triggers: safeParseTriggers(String(row.triggers)),
        }));
        return [...official, ...custom];
      }),
      Effect.mapError(wrapError)
    ),
});
