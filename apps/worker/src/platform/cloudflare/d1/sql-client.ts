import { Layer } from "effect";
import { D1Client } from "@effect/sql-d1";
import type { SqlClient } from "effect/unstable/sql/SqlClient";
import type { D1Database } from "@cloudflare/workers-types";

export type { SqlClient };

// The concrete-config layer cannot actually fail; the ConfigError in its
// signature only applies to the Config-wrapped variant.
export const D1SqlLive = (env: Env): Layer.Layer<D1Client.D1Client | SqlClient> =>
  Layer.orDie(D1Client.layer({ db: env.DB as unknown as D1Database }));
