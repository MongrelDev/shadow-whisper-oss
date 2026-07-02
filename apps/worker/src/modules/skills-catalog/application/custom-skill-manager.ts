import { Context, Effect, Layer } from "effect";
import { Observability } from "../../../observability/observability";
import type { CustomSkill } from "../domain/custom-skill";
import type { SkillDatabaseError, SkillNotFoundError } from "../errors";
import { CustomSkillRepository } from "./ports/custom-skill-repository";

export interface CreateCustomSkillInput {
  readonly userId: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly markdown: string;
  readonly triggers: readonly string[];
}

export interface UpdateCustomSkillInput {
  readonly userId: string;
  readonly id: string;
  readonly slug: string;
  readonly displayName: string;
  readonly description: string;
  readonly markdown: string;
  readonly triggers: readonly string[];
}

export interface CustomSkillManagerShape {
  readonly create: (
    input: CreateCustomSkillInput
  ) => Effect.Effect<CustomSkill, SkillDatabaseError>;
  readonly update: (
    input: UpdateCustomSkillInput
  ) => Effect.Effect<CustomSkill, SkillNotFoundError | SkillDatabaseError>;
  readonly remove: (userId: string, id: string) => Effect.Effect<void, SkillDatabaseError>;
}

export class CustomSkillManager extends Context.Service<
  CustomSkillManager,
  CustomSkillManagerShape
>()("CustomSkillManager") {}

export const CustomSkillManagerLive = Layer.effect(
  CustomSkillManager,
  Effect.gen(function* () {
    const repo = yield* CustomSkillRepository;
    const obs = yield* Observability;
    const capture = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
      Effect.tapError(effect, (error) => obs.failWideEvent(error));

    return CustomSkillManager.of({
      create: (input) =>
        capture(
          Effect.gen(function* () {
            yield* obs.setWideEvent({
              "skills.operation": "create_custom",
              slug: input.slug,
            });
            const skill = yield* repo.create(input);
            yield* obs.setWideEvent({ skillId: skill.id });
            return skill;
          })
        ),

      update: (input) =>
        capture(
          Effect.gen(function* () {
            yield* obs.setWideEvent({
              "skills.operation": "update_custom",
              skillId: input.id,
              slug: input.slug,
            });
            return yield* repo.update(input);
          })
        ),

      remove: (userId, id) =>
        capture(
          Effect.gen(function* () {
            yield* obs.setWideEvent({
              "skills.operation": "delete_custom",
              skillId: id,
            });
            yield* repo.remove(userId, id);
          })
        ),
    });
  })
);
