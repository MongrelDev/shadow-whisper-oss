const MAX_SLUG_SUFFIX = 99;

export class SlugAllocationFailedError extends Error {
  constructor(public readonly baseSlug: string) {
    super(
      `Could not allocate unused slug from base "${baseSlug}" within ${MAX_SLUG_SUFFIX} attempts`
    );
    this.name = "SlugAllocationFailedError";
  }
}

/**
 * Pick the first slug that does not collide with `existingSlugs`, starting
 * from `baseSlug`, then `${baseSlug}-2`, `${baseSlug}-3`, ... up to `-99`.
 * Throws SlugAllocationFailedError if all suffixes are taken.
 */
export function allocateUnusedSlug(baseSlug: string, existingSlugs: ReadonlySet<string>): string {
  if (!existingSlugs.has(baseSlug)) return baseSlug;
  for (let i = 2; i <= MAX_SLUG_SUFFIX; i++) {
    const candidate = `${baseSlug}-${i}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  throw new SlugAllocationFailedError(baseSlug);
}
