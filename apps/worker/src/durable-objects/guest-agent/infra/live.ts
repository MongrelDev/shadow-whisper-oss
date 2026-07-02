import { Layer } from "effect";
import { makeGemmaClient } from "../../../platform/cloudflare/workers-ai/ai-gemma";
import { SkillsLive } from "../../../modules/skills/infra/bundled-skill-repository";
import { SkillExecutor } from "../../../modules/skills-catalog/application/ports/skill-executor";
import { makeWorkersAiSkillExecutor } from "../../../modules/skills-catalog/infra/workers-ai-skill-executor";

export const makeDemoSkillExecutorLayer = (
  env: Env,
  opts?: { readonly skillExecutorLayer?: Layer.Layer<SkillExecutor> }
) => {
  const demoPrimary = makeGemmaClient(env, {
    chatMaxCompletionTokens: 1024,
    transformMaxCompletionTokens: 2048,
    sessionAffinity: "demo",
  });

  return Layer.mergeAll(
    SkillsLive(),
    opts?.skillExecutorLayer ??
      Layer.succeed(SkillExecutor, makeWorkersAiSkillExecutor({ primary: demoPrimary }))
  );
};
