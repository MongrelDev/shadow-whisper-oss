import { Effect } from "effect";
import { UnknownError } from "effect/Cause";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import { getWeekDateRange } from "../../../services/time-window";
import type { UsageReaderService } from "../application/ports/usage-reader";

export const makeD1UsageReader = (sql: SqlClient): UsageReaderService => ({
  getCurrentWeeklyUsage: (userId) => {
    const { start, end } = getWeekDateRange();
    const startMs = new Date(`${start}T00:00:00.000Z`).getTime();
    const endMs = new Date(`${end}T23:59:59.999Z`).getTime();

    return sql`
      SELECT COALESCE(SUM(word_count), 0) AS s
      FROM usage_entries
      WHERE user_id = ${userId} AND skill_id IS NULL
        AND created_at >= ${startMs} AND created_at <= ${endMs}
    `.pipe(
      Effect.map((rows: ReadonlyArray<Record<string, unknown>>) => {
        const totalWords = Number(rows[0]?.s ?? 0);
        return { spokenWords: totalWords, transformedWords: 0, totalWords };
      }),
      Effect.mapError((e) => new UnknownError(e, "getCurrentWeeklyUsage failed"))
    );
  },
});
