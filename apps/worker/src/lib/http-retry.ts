// HTTP statuses worth retrying or falling back on. Auth/client errors (400, 401,
// 403, 404, 422, ...) are not — they signal a misconfiguration or bad request
// that neither a retry nor an alternate engine will fix, so they should surface
// fast instead of being masked by silent fallback.
export const isRetryableHttpStatus = (status: number): boolean =>
  status === 408 || status === 409 || status === 429 || status >= 500;
