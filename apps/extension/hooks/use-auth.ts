import { authClient } from "~/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  return {
    session,
    user: session?.user ?? null,
    isLoading: isPending,
    isAuthenticated: session != null,
  };
}
