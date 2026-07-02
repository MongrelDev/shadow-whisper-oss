import { APP_REGISTRY_CATEGORIES, type AppRegistryCategory } from "@whisper/db";

export type AppCategory = AppRegistryCategory;

export const APP_CATEGORIES: readonly AppCategory[] = APP_REGISTRY_CATEGORIES;

const KNOWN_CATEGORIES = new Set<string>(APP_REGISTRY_CATEGORIES);

export const isAppCategory = (value: string): value is AppCategory => KNOWN_CATEGORIES.has(value);

export interface AppRegistryEntry {
  readonly hostName: string;
  readonly category: AppCategory;
}
