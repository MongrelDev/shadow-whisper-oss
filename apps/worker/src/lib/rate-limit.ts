export type RateLimitBindingName =
  | "RATE_LIMIT_1_PER_MIN"
  | "RATE_LIMIT_5_PER_MIN"
  | "RATE_LIMIT_10_PER_MIN";

export const checkRateLimit = async (
  env: Env,
  binding: RateLimitBindingName,
  key: string
): Promise<boolean> => {
  const { success } = await env[binding].limit({ key });
  return success;
};
