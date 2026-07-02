import type { ApiResult } from "../../shared/ipc-types";

export async function ipcCall<T>(
  fn: () => Promise<ApiResult<T>>,
  fallbackError = "IPC call failed"
): Promise<T> {
  const result = await fn();
  if (!result.success) {
    throw new Error(result.error ?? fallbackError);
  }
  return result.data;
}
