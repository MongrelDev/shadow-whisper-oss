import { useContext } from "react";
import { AuthContext } from "../providers/AuthProvider";
import type { SessionUser } from "../lib/auth-session";

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

export function useAuthenticatedUser(): SessionUser {
  const { user } = useAuthContext();
  if (!user) throw new Error("useAuthenticatedUser called outside authenticated route");
  return user;
}
