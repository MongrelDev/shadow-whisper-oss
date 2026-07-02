import { makeDomainRunner } from "../../bootstrap/run-domain-handler";
import { SkillsCatalogLive, type SkillsCatalogLiveOptions } from "./infra/live";

const _test = { overrides: undefined as SkillsCatalogLiveOptions | undefined };

export const runSkillsCatalogHandler = makeDomainRunner((env) =>
  SkillsCatalogLive(env, _test.overrides)
);

export const _testRuntime = {
  setOverrides: (opts: SkillsCatalogLiveOptions) => {
    _test.overrides = opts;
  },
  reset: () => {
    _test.overrides = undefined;
  },
};
