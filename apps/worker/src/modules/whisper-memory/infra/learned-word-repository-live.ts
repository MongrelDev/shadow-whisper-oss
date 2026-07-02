import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql/SqlClient";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { LearnedWordRepository } from "../application/ports/learned-word-repository";
import { makeD1LearnedWordRepository } from "./d1-learned-word-repository";

export const LearnedWordRepositoryLive = (env: Env, userId: string) =>
  Layer.effect(
    LearnedWordRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient;
      return makeD1LearnedWordRepository(sql, userId);
    })
  ).pipe(Layer.provide(D1SqlLive(env)));
