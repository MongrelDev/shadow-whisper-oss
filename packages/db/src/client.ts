import { drizzle, type DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "./schema";

export type DrizzleDatabase = DrizzleD1Database<typeof schema>;

/**
 * Create a Drizzle client for D1
 * Reserved for future use - currently using Durable Objects
 */
export function createDb(d1: D1Database): DrizzleDatabase {
  return drizzle(d1, { schema });
}
