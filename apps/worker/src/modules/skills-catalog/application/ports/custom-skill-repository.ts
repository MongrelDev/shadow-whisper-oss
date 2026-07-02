import { Context, Effect } from "effect";
import type { CustomSkill } from "../../domain/custom-skill";
import type { SkillDatabaseError, SkillNotFoundError } from "../../errors";

export interface CustomSkillRepositoryService {
  readonly create: (params: {
    userId: string;
    slug: string;
    displayName: string;
    description: string;
    markdown: string;
    triggers: readonly string[];
  }) => Effect.Effect<CustomSkill, SkillDatabaseError>;
  readonly update: (params: {
    userId: string;
    id: string;
    slug: string;
    displayName: string;
    description: string;
    markdown: string;
    triggers: readonly string[];
  }) => Effect.Effect<CustomSkill, SkillNotFoundError | SkillDatabaseError>;
  readonly remove: (userId: string, id: string) => Effect.Effect<void, SkillDatabaseError>;
  readonly get: (
    userId: string,
    id: string
  ) => Effect.Effect<CustomSkill | null, SkillDatabaseError>;
  readonly list: (userId: string) => Effect.Effect<CustomSkill[], SkillDatabaseError>;
}

export class CustomSkillRepository extends Context.Service<
  CustomSkillRepository,
  CustomSkillRepositoryService
>()("CustomSkillRepository") {}
