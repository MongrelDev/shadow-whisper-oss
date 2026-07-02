import { Context, Effect } from "effect";
import type { AppRegistryEntry } from "../../domain/app-category";
import type { AppCategoryError } from "../../errors";

export interface ResolveAppCategoryInput {
  readonly bundleId: string;
  readonly host: string | null;
}

export interface AppCategoryRepositoryService {
  readonly resolve: (
    input: ResolveAppCategoryInput
  ) => Effect.Effect<AppRegistryEntry | null, AppCategoryError>;
}

export class AppCategoryRepository extends Context.Service<
  AppCategoryRepository,
  AppCategoryRepositoryService
>()("AppCategoryRepository") {}
