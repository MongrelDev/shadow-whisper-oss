import { Context, Effect } from "effect";
import type { InstalledSkillSummary } from "../../domain/installed-skill";
import type { SkillInstallationError } from "../../errors";

export interface SkillInstallationRepositoryService {
  readonly install: (params: {
    userId: string;
    skillId: string;
    displayName: string;
    description: string;
    slug: string;
  }) => Effect.Effect<void, SkillInstallationError>;
  readonly uninstall: (
    userId: string,
    skillId: string
  ) => Effect.Effect<void, SkillInstallationError>;
  readonly listInstalled: (
    userId: string
  ) => Effect.Effect<InstalledSkillSummary[], SkillInstallationError>;
}

export class SkillInstallationRepository extends Context.Service<
  SkillInstallationRepository,
  SkillInstallationRepositoryService
>()("SkillInstallationRepository") {}
