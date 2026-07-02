import { Effect } from "effect";
import { sql, type DrizzleDatabase } from "@whisper/db";
import type {
  AppRegistryCandidatesService,
  TouchCandidateInput,
} from "../application/ports/app-registry-candidates";
import { AppRegistryCandidatesError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeD1AppRegistryCandidates = (db: DrizzleDatabase): AppRegistryCandidatesService => ({
  touch: (input: TouchCandidateInput) =>
    Effect.tryPromise({
      try: () =>
        db.run(sql`
          INSERT INTO app_registry_candidates (identifier, identifier_type, occurrence_count, last_seen_at)
          VALUES (${input.identifier}, ${input.identifierType}, 1, ${input.nowMs})
          ON CONFLICT(identifier) DO UPDATE SET
            occurrence_count = occurrence_count + 1,
            last_seen_at = excluded.last_seen_at
        `),
      catch: (e) =>
        new AppRegistryCandidatesError({
          message: `app_registry_candidates.touch failed: ${unknownMessage(e)}`,
        }),
    }).pipe(Effect.asVoid),
});
