import { Effect, Layer } from "effect";
import type { InstalledSkillSummary } from "../../skills-catalog/domain/installed-skill";
import {
  SkillInstallationRepository,
  type SkillInstallationRepositoryService,
} from "../../skills-catalog/application/ports/skill-installation-repository";
import {
  SkillRepository,
  type SkillRepositoryService,
} from "../../skills/application/ports/skill-repository";
import { TRANSCRIPT_OPERATIONS, suggestedOperationForCategory } from "../domain/operations";
import { ImprovementFlowSelector, type ImprovementFlow } from "./ports/improvement-flow";
import type { ForcedSkillParams, VoiceSkillsParams } from "./ports/text-improver";
import { buildForcedSkillSection, buildIntentRouterSection } from "./prompt-assembly";

const VOICE_SKILLS_HEADER =
  "Process the transcript below: faithful cleanup by default, or apply one operation or skill when the intent clearly calls for it.";
const FORCED_SKILL_HEADER =
  "Process the transcript below according to the skill instructions in the system prompt.";

// Official installed-skill rows only persist display metadata; their voice triggers
// live in the bundled manifest. Join them back in so the intent router can match the
// speaker's invocation phrase against real trigger phrases, not just the name.
const withOfficialTriggers = (
  skills: ReadonlyArray<InstalledSkillSummary>,
  officialSkills: SkillRepositoryService
): InstalledSkillSummary[] =>
  skills.map((s) =>
    s.triggers && s.triggers.length > 0
      ? s
      : { ...s, triggers: officialSkills.getById(s.skillId)?.triggers ?? [] }
  );

// Default flow: faithful cleanup plus the intent router. Loads the user's installed
// skills (best-effort) and offers them — together with the system operations — as the
// generator's tool catalog.
const makeVoiceSkillsFlow = (
  skillInstallations: SkillInstallationRepositoryService,
  officialSkills: SkillRepositoryService,
  params: VoiceSkillsParams
): ImprovementFlow => ({
  contribute: Effect.fnUntraced(function* (ctx) {
    const installed = yield* skillInstallations.listInstalled(params.userId).pipe(
      Effect.map((skills) => withOfficialTriggers(skills, officialSkills)),
      Effect.catch(() => Effect.succeed([] as InstalledSkillSummary[]))
    );

    return {
      directive: buildIntentRouterSection(
        TRANSCRIPT_OPERATIONS,
        installed,
        suggestedOperationForCategory(ctx.category)
      ),
      userHeader: VOICE_SKILLS_HEADER,
      routing: { operations: TRANSCRIPT_OPERATIONS, installed },
    };
  }),
});

// Forced-skill flow: a single mandatory skill, no intent router and no tool catalog.
const makeForcedSkillFlow = (params: ForcedSkillParams): ImprovementFlow => ({
  contribute: () =>
    Effect.succeed({
      directive: buildForcedSkillSection(params.skillMarkdown),
      userHeader: FORCED_SKILL_HEADER,
    }),
});

export const ImprovementFlowSelectorLive = Layer.effect(
  ImprovementFlowSelector,
  Effect.gen(function* () {
    const skillInstallations = yield* SkillInstallationRepository;
    const officialSkills = yield* SkillRepository;
    return {
      // The one allowed seam: pick the flow from the mode, bind it to the params.
      forParams: (params) =>
        params.mode === "voice-skills"
          ? makeVoiceSkillsFlow(skillInstallations, officialSkills, params)
          : makeForcedSkillFlow(params),
    };
  })
);
