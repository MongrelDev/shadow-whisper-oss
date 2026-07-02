/**
 * Resolves a user-facing message for an auth mutation error. Real `Error`s carry
 * an actionable message; anything else collapses to a localized fallback so we
 * never surface a raw thrown value.
 */
export function authErrorMessage(error: unknown, fallback: string): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : fallback;
}
