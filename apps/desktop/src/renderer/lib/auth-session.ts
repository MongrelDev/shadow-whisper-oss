import type { AuthSessionUser } from "../../shared/ipc-types";

export type SessionUser = AuthSessionUser;

export async function fetchSessionUser(): Promise<SessionUser | null> {
  return window.api.auth.getSession();
}
