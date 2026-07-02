import { Data } from "effect";

export class BillingDatabaseError extends Data.TaggedError("BillingDatabaseError")<{
  readonly message: string;
  readonly internal?: {
    readonly op?: string;
    readonly userId?: string;
    readonly correlationId?: string;
  };
}> {}

export class StripeWebhookProcessingError extends Data.TaggedError("StripeWebhookProcessingError")<{
  readonly message: string;
  readonly internal: {
    readonly eventType: string;
    readonly stripeEventId: string;
    readonly cause: string;
  };
}> {}

export class LimitExceededError extends Data.TaggedError("LimitExceededError")<{
  readonly message: string;
  readonly usage: { totalWords: number; limit: number };
}> {}
