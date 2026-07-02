import { Context, Effect } from "effect";
import type { OfficialSkillDefinition, SkillLoaderError } from "../../domain/types";

export interface SkillRepositoryService {
  readonly load: (key: string) => Effect.Effect<string | null, SkillLoaderError>;
  readonly compose: (keys: ReadonlyArray<string>) => Effect.Effect<string, SkillLoaderError>;
  readonly getById: (id: string) => OfficialSkillDefinition | null;
  readonly list: () => readonly OfficialSkillDefinition[];
  readonly listDemo: () => readonly OfficialSkillDefinition[];
}

export class SkillRepository extends Context.Service<SkillRepository, SkillRepositoryService>()(
  "SkillRepository"
) {}
