import { cloneDeep, mergeWith } from "es-toolkit";

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function mergeConfig<T>(base: T, patch: DeepPartial<T>): T {
  return mergeWith(cloneDeep(base) as object, patch as object, (_, src) =>
    Array.isArray(src) ? src : undefined
  ) as T;
}
