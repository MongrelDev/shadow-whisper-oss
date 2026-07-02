import { useMutation } from "@tanstack/react-query";
import { m } from "~/paraglide/messages";
import { authErrorMessage } from "../lib/auth-error-message";

export interface UseBrowserAuthOptions {
  onRequestSuccess?: () => void;
}

export interface UseBrowserAuthResult {
  requestAuth: () => void;
  requestSucceeded: boolean;
  isRequestingAuth: boolean;
  requestError: string | null;
  authenticate: (token: string) => void;
  isAuthenticating: boolean;
  authError: string | null;
}

export function useBrowserAuth(options: UseBrowserAuthOptions = {}): UseBrowserAuthResult {
  const requestAuthMutation = useMutation({
    mutationFn: () => window.requestAuth(),
    onSuccess: () => options.onRequestSuccess?.(),
  });

  const authenticateMutation = useMutation({
    mutationFn: (token: string) => window.authenticate({ token }),
  });

  return {
    requestAuth: () => requestAuthMutation.mutate(),
    requestSucceeded: requestAuthMutation.isSuccess,
    isRequestingAuth: requestAuthMutation.isPending,
    requestError: authErrorMessage(requestAuthMutation.error, m.auth_browser_launch_failed()),
    authenticate: (token: string) => authenticateMutation.mutate(token),
    isAuthenticating: authenticateMutation.isPending,
    authError: authErrorMessage(authenticateMutation.error, m.auth_browser_token_failed()),
  };
}
