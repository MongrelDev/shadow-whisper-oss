import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql/SqlClient";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { DictionaryRepository } from "../application/ports/dictionary-repository";
import { DictionaryServiceLive } from "../application/dictionary-service";
import { makeD1DictionaryRepository } from "./d1-dictionary-repository";

export const DictionaryRepositoryLive = (env: Env) =>
  Layer.effect(
    DictionaryRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient;
      return makeD1DictionaryRepository(sql);
    })
  ).pipe(Layer.provide(D1SqlLive(env)));

export const DictionaryLive = (env: Env) => {
  const InfraLive = DictionaryRepositoryLive(env);
  const ServicesLive = DictionaryServiceLive.pipe(Layer.provide(InfraLive));
  return Layer.mergeAll(InfraLive, ServicesLive);
};
