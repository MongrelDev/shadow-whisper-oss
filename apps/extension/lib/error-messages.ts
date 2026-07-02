import { m } from "~/paraglide/messages";

type MessageFn = () => string;

const ERROR_CODE_MAP: Record<string, MessageFn> = {
  quota_exceeded: () => m.error_quota_exceeded(),
  er_limit_exceeded: () => m.error_quota_exceeded(),
  unauthenticated: () => m.error_unauthenticated(),
  er_authentication: () => m.error_unauthenticated(),
  rate_limited: () => m.error_rate_limited(),
  er_rate_limit: () => m.error_rate_limited(),
  payload_too_large: () => m.error_payload_too_large(),
  er_payload_too_large: () => m.error_payload_too_large(),
  network: () => m.error_network(),
  transcription_timeout: () => m.error_transcription_timeout(),
  transcribe_failed: () => m.error_transcription_failed(),
  transcription_failed: () => m.error_transcription_failed(),
};

export function errorMessageForCode(code: string): string {
  return (ERROR_CODE_MAP[code] ?? m.error_generic)();
}
