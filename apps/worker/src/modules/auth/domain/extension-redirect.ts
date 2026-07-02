const CHROMIUMAPP_REDIRECT_RE = /^https:\/\/[a-z]{32}\.chromiumapp\.org\//;

/**
 * A Chrome extension OAuth redirect must target the extension's own
 * `chromiumapp.org` callback. When the extension id is known, the host's
 * leading label must match it so one extension cannot complete another's flow.
 */
export const isValidExtensionRedirectUri = (redirectUri: string, extensionId: string): boolean => {
  if (!CHROMIUMAPP_REDIRECT_RE.test(redirectUri)) return false;
  if (!extensionId) return true;
  return new URL(redirectUri).hostname.split(".")[0] === extensionId;
};
