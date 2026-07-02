import { Effect } from "effect";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import type { DictionaryRepositoryService } from "../application/ports/dictionary-repository";
import type { Dictionary, DictionaryWord, Snippet } from "../domain/dictionary";
import { DictionaryRepositoryError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

const toRepoError =
  (op: string) =>
  (e: unknown): DictionaryRepositoryError =>
    new DictionaryRepositoryError({
      message: `${op} failed: ${unknownMessage(e)}`,
    });

type Row = Record<string, unknown>;

const toWord = (row: Row): DictionaryWord => ({
  id: Number(row.id),
  word: String(row.word),
  createdAt: Number(row.createdAt),
});

const toSnippet = (row: Row): Snippet => ({
  id: Number(row.id),
  triggerPhrase: String(row.triggerPhrase),
  expandedText: String(row.expandedText),
  createdAt: Number(row.createdAt),
});

export const makeD1DictionaryRepository = (sql: SqlClient): DictionaryRepositoryService => ({
  getDictionary: (userId) =>
    Effect.all(
      [
        sql`
          SELECT id, word, created_at AS createdAt
          FROM dictionary_words WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `,
        sql`
          SELECT id, trigger_phrase AS triggerPhrase, expanded_text AS expandedText,
            created_at AS createdAt
          FROM dictionary_snippets WHERE user_id = ${userId}
          ORDER BY created_at DESC
        `,
      ],
      { concurrency: 2 }
    ).pipe(
      Effect.map(
        ([words, snippets]): Dictionary => ({
          words: (words as ReadonlyArray<Row>).map(toWord),
          snippets: (snippets as ReadonlyArray<Row>).map(toSnippet),
        })
      ),
      Effect.mapError(toRepoError("getDictionary"))
    ),

  addWord: (userId, word) =>
    sql`
      INSERT INTO dictionary_words (user_id, word, created_at)
      VALUES (${userId}, ${word}, ${Date.now()})
      RETURNING id, word, created_at AS createdAt
    `.pipe(
      Effect.mapError(toRepoError("addWord")),
      Effect.flatMap((rows: ReadonlyArray<Row>) =>
        rows[0]
          ? Effect.succeed(toWord(rows[0]))
          : Effect.fail(new DictionaryRepositoryError({ message: "addWord returned no row" }))
      )
    ),

  removeWord: (userId, id) =>
    sql`DELETE FROM dictionary_words WHERE user_id = ${userId} AND id = ${id}`.pipe(
      Effect.asVoid,
      Effect.mapError(toRepoError("removeWord"))
    ),

  addSnippet: (userId, triggerPhrase, expandedText) =>
    sql`
      INSERT INTO dictionary_snippets (user_id, trigger_phrase, expanded_text, created_at)
      VALUES (${userId}, ${triggerPhrase}, ${expandedText}, ${Date.now()})
      RETURNING id, trigger_phrase AS triggerPhrase, expanded_text AS expandedText,
        created_at AS createdAt
    `.pipe(
      Effect.mapError(toRepoError("addSnippet")),
      Effect.flatMap((rows: ReadonlyArray<Row>) =>
        rows[0]
          ? Effect.succeed(toSnippet(rows[0]))
          : Effect.fail(new DictionaryRepositoryError({ message: "addSnippet returned no row" }))
      )
    ),

  removeSnippet: (userId, id) =>
    sql`DELETE FROM dictionary_snippets WHERE user_id = ${userId} AND id = ${id}`.pipe(
      Effect.asVoid,
      Effect.mapError(toRepoError("removeSnippet"))
    ),
});
