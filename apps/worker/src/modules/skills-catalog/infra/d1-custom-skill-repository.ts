import { Effect } from "effect";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import { SkillDatabaseError, SkillNotFoundError } from "../errors";
import type { CustomSkillRepositoryService } from "../application/ports/custom-skill-repository";
import type { CustomSkill } from "../domain/custom-skill";
import { unknownMessage } from "../../../lib/unknown-message";

const wrapError = (e: unknown) => new SkillDatabaseError({ message: unknownMessage(e) });

type Row = Record<string, unknown>;

const safeParseTriggers = (raw: string): string[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
};

const toCustomSkill = (row: Row): CustomSkill => ({
  id: String(row.id),
  slug: String(row.slug),
  displayName: String(row.displayName),
  description: String(row.description),
  markdown: String(row.markdown),
  triggers: safeParseTriggers(String(row.triggers)),
  createdAt: Number(row.createdAt),
  updatedAt: Number(row.updatedAt),
});

const SELECT_COLUMNS = `
  id, slug, display_name AS displayName, description, markdown, triggers,
  created_at AS createdAt, updated_at AS updatedAt
`;

export const makeD1CustomSkillRepository = (sql: SqlClient): CustomSkillRepositoryService => ({
  create: ({ userId, slug, displayName, description, markdown, triggers }) => {
    const now = Date.now();
    return sql`
      INSERT INTO custom_skills (
        id, user_id, slug, display_name, description, markdown, triggers,
        created_at, updated_at
      ) VALUES (
        ${crypto.randomUUID()}, ${userId}, ${slug}, ${displayName}, ${description},
        ${markdown}, ${JSON.stringify([...triggers])}, ${now}, ${now}
      )
      RETURNING ${sql.literal(SELECT_COLUMNS)}
    `.pipe(
      Effect.mapError(wrapError),
      Effect.flatMap((rows: ReadonlyArray<Row>) =>
        rows[0]
          ? Effect.succeed(toCustomSkill(rows[0]))
          : Effect.fail(new SkillDatabaseError({ message: "createCustomSkill returned no row" }))
      )
    );
  },

  update: ({ userId, id, slug, displayName, description, markdown, triggers }) =>
    sql`
      UPDATE custom_skills SET
        slug = ${slug},
        display_name = ${displayName},
        description = ${description},
        markdown = ${markdown},
        triggers = ${JSON.stringify([...triggers])},
        updated_at = ${Date.now()}
      WHERE user_id = ${userId} AND id = ${id}
      RETURNING ${sql.literal(SELECT_COLUMNS)}
    `.pipe(
      Effect.mapError(wrapError),
      Effect.flatMap((rows: ReadonlyArray<Row>) =>
        rows[0]
          ? Effect.succeed(toCustomSkill(rows[0]))
          : Effect.fail(new SkillNotFoundError({ id }))
      )
    ),

  remove: (userId, id) =>
    sql`DELETE FROM custom_skills WHERE user_id = ${userId} AND id = ${id}`.pipe(
      Effect.asVoid,
      Effect.mapError(wrapError)
    ),

  get: (userId, id) =>
    sql`
      SELECT ${sql.literal(SELECT_COLUMNS)}
      FROM custom_skills WHERE user_id = ${userId} AND id = ${id} LIMIT 1
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => (rows[0] ? toCustomSkill(rows[0]) : null)),
      Effect.mapError(wrapError)
    ),

  list: (userId) =>
    sql`
      SELECT ${sql.literal(SELECT_COLUMNS)}
      FROM custom_skills WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `.pipe(
      Effect.map((rows: ReadonlyArray<Row>) => rows.map(toCustomSkill)),
      Effect.mapError(wrapError)
    ),
});
