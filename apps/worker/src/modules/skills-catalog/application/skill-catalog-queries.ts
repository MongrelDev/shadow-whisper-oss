import { Context, Effect, Layer } from "effect";
import { Observability, captureWideEventError } from "../../../observability/observability";
import type { SkillInstallationError, SkillDatabaseError } from "../errors";
import { SkillInstallationRepository } from "./ports/skill-installation-repository";
import { CustomSkillRepository } from "./ports/custom-skill-repository";
import { SkillRepository } from "../../skills/application/ports/skill-repository";
import type { Skill } from "../domain/skill";

export interface ListSkillsInput {
  readonly userId: string;
}

export interface SkillCatalogQueriesShape {
  readonly list: (
    input: ListSkillsInput
  ) => Effect.Effect<Skill[], SkillInstallationError | SkillDatabaseError, Observability>;
}

export class SkillCatalogQueries extends Context.Service<
  SkillCatalogQueries,
  SkillCatalogQueriesShape
>()("SkillCatalogQueries") {}

export const SkillCatalogQueriesLive = Layer.effect(
  SkillCatalogQueries,
  Effect.gen(function* () {
    const installations = yield* SkillInstallationRepository;
    const customRepo = yield* CustomSkillRepository;
    const skillRepo = yield* SkillRepository;

    return SkillCatalogQueries.of({
      list: ({ userId }) =>
        Effect.gen(function* () {
          const obs = yield* Observability;
          yield* obs.setWideEvent({ "skills.operation": "list" });

          const official = skillRepo.list();
          const [installed, custom] = yield* Effect.all([
            installations.listInstalled(userId),
            customRepo.list(userId),
          ]);

          const installedIds = new Set(installed.map((s) => s.skillId));

          const officialSkills: Skill[] = official.map((s) => ({
            id: s.id,
            slug: s.slug,
            displayName: s.displayName,
            description: s.description,
            triggers: [...s.triggers],
            markdown: null,
            source: "official" as const,
            isInstalled: installedIds.has(s.id),
            createdAt: null,
            updatedAt: null,
          }));

          const customSkills: Skill[] = custom.map((s) => ({
            id: s.id,
            slug: s.slug,
            displayName: s.displayName,
            description: s.description,
            triggers: [...s.triggers],
            markdown: s.markdown,
            source: "custom" as const,
            isInstalled: true,
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
          }));

          const result = [...customSkills, ...officialSkills];

          yield* obs.setWideEvent({
            skillCount: result.length,
            customSkillCount: customSkills.length,
            installedSkillCount: result.filter((skill) => skill.isInstalled).length,
          });
          return result;
        }).pipe(captureWideEventError),
    });
  })
);
