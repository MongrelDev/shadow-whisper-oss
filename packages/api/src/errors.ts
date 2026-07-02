export type ErrorCode =
  // Generic / infra
  | "er_validation"
  | "er_authentication"
  | "er_rate_limit"
  | "er_database"
  | "er_internal"
  | "er_not_found"
  // Billing
  | "er_missing_checkout_token"
  | "er_invalid_checkout_token"
  // Transform + Transcription
  | "er_limit_exceeded"
  | "er_text_transformer"
  | "er_audio_store"
  | "er_missing_audio"
  | "er_websocket_upgrade_required"
  // WhisperAgent
  | "er_feature_disabled"
  | "er_not_implemented"
  | "er_whisper_agent"
  // Skills
  | "er_skill_not_found"
  | "er_skill_conflict"
  | "er_skill_forbidden"
  | "er_skill_not_official"
  // Feedback (Ensinar)
  | "er_feedback_invalid"
  | "er_feedback_too_many_candidates"
  | "er_feedback_persist_failed"
  | "er_teach_detection_failed"
  | "er_suggestion_not_found"
  // Affiliate
  | "er_invalid_affiliate_code"
  | "er_self_referral"
  | "er_email_already_exists"
  | "er_code_generation"
  // Email validation
  | "er_disposable_email"
  // Demo (anonymous endpoints)
  | "er_origin_forbidden"
  | "er_payload_too_large";

export type ErrorResponse<Code extends ErrorCode = ErrorCode, Details = Record<string, unknown>> = {
  readonly error_code: Code;
  readonly details?: Details;
};
