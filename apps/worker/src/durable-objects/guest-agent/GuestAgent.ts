import { Agent, callable } from "agents";
import { Context, Effect, Layer, Tracer } from "effect";
import { INITIAL_GUEST_STATE, type GuestState } from "./state";
import { makeDemoSkillExecutorLayer } from "./infra/live";
import { runDemoSkill, type ProcessDemoSkillResult } from "./run-demo-skill";
import { OtlpTracingLive } from "../../observability/tracing";

type GuestAgentServices = Layer.Success<ReturnType<typeof makeDemoSkillExecutorLayer>>;

export class GuestAgent extends Agent<Env, GuestState> {
  override initialState: GuestState = INITIAL_GUEST_STATE;

  #layer: Layer.Layer<GuestAgentServices> | null = null;

  private getLayer(): Layer.Layer<GuestAgentServices> {
    this.#layer ??= makeDemoSkillExecutorLayer(this.env);
    return this.#layer;
  }

  @callable()
  async processWithDemoSkill(input: {
    rawText: string;
    skillKey: string;
    jobId?: string;
    gatewayMetadata?: Readonly<Record<string, string>>;
    traceContext?: { traceId: string; spanId: string; sampled: boolean };
  }): Promise<ProcessDemoSkillResult> {
    const { skillKey, traceContext, ...rest } = input;

    const pipeline = runDemoSkill({ ...rest, skillKeys: [skillKey] }).pipe(
      Effect.withSpan("guest-agent.process-demo-skill", {
        attributes: {
          "skill.key": skillKey,
          "input.length": input.rawText.length,
        },
      })
    );

    const externalSpan: Tracer.ExternalSpan | undefined = traceContext
      ? {
          _tag: "ExternalSpan" as const,
          spanId: traceContext.spanId,
          traceId: traceContext.traceId,
          sampled: traceContext.sampled,
          annotations: Context.empty(),
        }
      : undefined;

    const effect = externalSpan
      ? pipeline.pipe(Effect.provideService(Tracer.ParentSpan, externalSpan))
      : pipeline;

    return Effect.runPromise(
      effect.pipe(Effect.provide(Layer.mergeAll(this.getLayer(), OtlpTracingLive(this.env))))
    );
  }
}
