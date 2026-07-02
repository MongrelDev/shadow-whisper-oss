import { Effect } from "effect";
import { createDb, eq, user as userTable } from "@whisper/db";
import type { AccountReaderService } from "../application/ports/account-reader";
import { AuthDatabaseError } from "../errors";
import { unknownMessage } from "../../../lib/unknown-message";

export const makeD1AccountReader = (env: Env): AccountReaderService => ({
  emailVerificationStatus: (email) =>
    Effect.tryPromise({
      try: async () => {
        const db = createDb(env.DB);
        const row = await db
          .select({ emailVerified: userTable.emailVerified })
          .from(userTable)
          .where(eq(userTable.email, email.trim().toLowerCase()))
          .get();
        return row?.emailVerified ?? false;
      },
      catch: (e) => new AuthDatabaseError({ message: unknownMessage(e) }),
    }),
});
