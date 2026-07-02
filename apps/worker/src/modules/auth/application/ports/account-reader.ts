import { Context, Effect } from "effect";
import type { AuthDatabaseError } from "../../errors";

export interface AccountReaderService {
  readonly emailVerificationStatus: (email: string) => Effect.Effect<boolean, AuthDatabaseError>;
}

export class AccountReader extends Context.Service<AccountReader, AccountReaderService>()(
  "AccountReader"
) {}
