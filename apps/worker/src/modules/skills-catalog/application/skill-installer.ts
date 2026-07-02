import { Context, Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import type { SkillInstallationError } from "../errors";
import { SkillNotFoundError } from "../errors";
import { SkillInstallationRepository } from "./ports/skill-installation-repository";
import { SkillRepository } from "../../skills/application/ports/skill-repository";

export interface InstallSkillInput {
  readonly userId: string;
  readonly skillId: string;
}

export interface UninstallSkillInput {
  readonly userId: string;
  readonly skillId: string;
}

export interface SkillInstallerShape {
  readonly install: (
    input: InstallSkillInput
  ) => Effect.Effect<void, SkillNotFoundError | SkillInstallationError>;
  readonly uninstall: (input: UninstallSkillInput) => Effect.Effect<void, SkillInstallationError>;
}

export class SkillInstaller extends Context.Service<SkillInstaller, SkillInstallerShape>()(
  "SkillInstaller"
) {}

export const SkillInstallerLive = Layer.effect(
  SkillInstaller,
  Effect.gen(function* () {
    const installRepo = yield* SkillInstallationRepository;
    const skillRepo = yield* SkillRepository;
    const obs = yield* Observability;
    const capture = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    return SkillInstaller.of({
      install: ({ userId, skillId }) =>
        capture(
          Effect.gen(function* () {
            yield* obs.setWideEvent({
              "skills.operation": "install",
              skillId,
            });

            const official = skillRepo.getById(skillId);
            if (!official) {
              return yield* new SkillNotFoundError({ id: skillId });
            }

            yield* obs.setWideEvent({
              skillSlug: official.slug,
              source: "official",
            });

            yield* installRepo.install({
              userId,
              skillId: official.id,
              displayName: official.displayName,
              description: official.description,
              slug: official.slug,
            });

            yield* obs.setWideEvent({ installed: true });
          })
        ),

      uninstall: ({ userId, skillId }) =>
        capture(
          Effect.gen(function* () {
            yield* obs.setWideEvent({
              "skills.operation": "uninstall",
              skillId,
            });
            yield* installRepo.uninstall(userId, skillId);
            yield* obs.setWideEvent({ installed: false });
          })
        ),
    });
  })
);
