import { m } from "~/paraglide/messages";
import type { ErrorCode } from "@whisper/api";

export function resolveErrorMessage(code: ErrorCode): string {
  const fn = (m as Record<string, unknown>)[code];
  return typeof fn === "function" ? (fn as () => string)() : m.er_internal();
}
