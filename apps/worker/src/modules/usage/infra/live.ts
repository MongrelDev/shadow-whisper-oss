import { Effect, Layer } from "effect";
import { createDb } from "@whisper/db";
import { AppCategoryRepository } from "../../transcription/application/ports/app-category-repository";
import { makeD1AppCategoryRepository } from "../../transcription/infra/d1-app-category-repository";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { AppRegistryCandidates } from "../application/ports/app-registry-candidates";
import { UsageTracker } from "../application/ports/usage-tracker";
import { UsageLedger } from "../application/usage-ledger-service";
import { UsageAnalyticsServiceLive } from "../application/usage-analytics-service";
import { makeD1AppRegistryCandidates } from "./d1-app-registry-candidates";
import { makeLedgerUsageTracker } from "./ledger-usage-tracker";
import { UsageLedgerLive } from "./usage-ledger-live";

const LedgerLive = (env: Env) => UsageLedgerLive.pipe(Layer.provide(D1SqlLive(env)));

export const UsageHandlerLive = (env: Env) => {
  const db = createDb(env.DB);
  const infra = Layer.mergeAll(
    Layer.succeed(AppCategoryRepository, makeD1AppCategoryRepository(db)),
    LedgerLive(env)
  );
  const services = UsageAnalyticsServiceLive.pipe(Layer.provide(infra));
  return Layer.mergeAll(infra, services);
};

export const UsageLive = (env: Env, userId: string) => {
  const db = createDb(env.DB);
  const infra = Layer.mergeAll(
    Layer.succeed(AppRegistryCandidates, makeD1AppRegistryCandidates(db)),
    LedgerLive(env)
  );
  const tracker = Layer.effect(
    UsageTracker,
    Effect.gen(function* () {
      const appRegistryCandidates = yield* AppRegistryCandidates;
      const ledger = yield* UsageLedger;
      return makeLedgerUsageTracker({ userId, ledger, appRegistryCandidates });
    })
  );
  return Layer.mergeAll(infra, tracker.pipe(Layer.provide(infra)));
};
