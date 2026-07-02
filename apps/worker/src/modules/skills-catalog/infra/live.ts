import { Effect, Layer } from "effect";
import { SqlClient } from "effect/unstable/sql/SqlClient";
import { makeGemmaClient } from "../../../platform/cloudflare/workers-ai/ai-gemma";
import { makeGroqChatClient } from "../../../platform/cloudflare/workers-ai/ai-groq-chat";
import { D1SqlLive } from "../../../platform/cloudflare/d1/sql-client";
import { SkillsLive } from "../../skills/infra/bundled-skill-repository";
import { UsageLedger } from "../../usage/application/usage-ledger-service";
import { UsageLedgerLive } from "../../usage/infra/usage-ledger-live";
import { SkillExecutor } from "../application/ports/skill-executor";
import { SkillInstallationRepository } from "../application/ports/skill-installation-repository";
import { SkillUsageRecorder } from "../application/ports/skill-usage-recorder";
import { CustomSkillRepository } from "../application/ports/custom-skill-repository";
import { SkillBuilder } from "../application/ports/skill-builder";
import { SkillCatalogQueriesLive } from "../application/skill-catalog-queries";
import { CustomSkillManagerLive } from "../application/custom-skill-manager";
import { SkillInstallerLive } from "../application/skill-installer";
import { SkillSyncExecutorLive } from "../application/skill-sync-executor";
import { makeD1SkillInstallationRepository } from "./d1-skill-installation-repository";
import { makeWorkersAiSkillExecutor } from "./workers-ai-skill-executor";
import { makeLedgerSkillUsageRecorder } from "./ledger-skill-usage-recorder";
import { makeD1CustomSkillRepository } from "./d1-custom-skill-repository";
import { makeWorkersAiSkillBuilder } from "./workers-ai-skill-builder";

export interface SkillsCatalogLiveOptions {
  readonly skillExecutorLayer?: Layer.Layer<SkillExecutor>;
}

export const SkillInstallationRepositoryLive = (env: Env) =>
  Layer.effect(
    SkillInstallationRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient;
      return makeD1SkillInstallationRepository(sql);
    })
  ).pipe(Layer.provide(D1SqlLive(env)));

export const SkillsCatalogLive = (env: Env, opts?: SkillsCatalogLiveOptions) => {
  const primary = makeGroqChatClient(env, {
    chatMaxCompletionTokens: 1024,
    transformMaxCompletionTokens: 2048,
  });
  const fallback = makeGemmaClient(env, {
    chatMaxCompletionTokens: 1024,
    transformMaxCompletionTokens: 2048,
    sessionAffinity: "skills-catalog",
  });

  const sqlLayer = D1SqlLive(env);
  const ledgerLayer = UsageLedgerLive.pipe(Layer.provide(sqlLayer));

  const installationRepositoryLayer = SkillInstallationRepositoryLive(env);

  const customSkillRepositoryLayer = Layer.effect(
    CustomSkillRepository,
    Effect.gen(function* () {
      const sql = yield* SqlClient;
      return makeD1CustomSkillRepository(sql);
    })
  ).pipe(Layer.provide(sqlLayer));

  const skillUsageRecorderLayer = Layer.effect(
    SkillUsageRecorder,
    Effect.gen(function* () {
      const ledger = yield* UsageLedger;
      return makeLedgerSkillUsageRecorder(ledger);
    })
  ).pipe(Layer.provide(ledgerLayer));

  const InfraLive = Layer.mergeAll(
    opts?.skillExecutorLayer ??
      Layer.succeed(SkillExecutor, makeWorkersAiSkillExecutor({ primary, fallback })),
    installationRepositoryLayer,
    skillUsageRecorderLayer,
    customSkillRepositoryLayer,
    Layer.succeed(SkillBuilder, makeWorkersAiSkillBuilder(env))
  );

  const skillsLayer = SkillsLive();
  const PortsLive = Layer.mergeAll(InfraLive, skillsLayer);

  const ServicesLive = Layer.mergeAll(
    SkillCatalogQueriesLive,
    CustomSkillManagerLive,
    SkillInstallerLive,
    SkillSyncExecutorLive
  ).pipe(Layer.provide(PortsLive));

  return Layer.mergeAll(PortsLive, ServicesLive);
};
