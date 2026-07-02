import { Effect } from "effect";
import type { ChatService } from "../../../platform/cloudflare/workers-ai/ai";
import { buildSkillSystem, buildSkillUserMessage } from "../domain/skill-prompt";
import { SkillExecutionError } from "../errors";
import type { SkillExecutorService } from "../application/ports/skill-executor";
import { unknownMessage } from "../../../lib/unknown-message";

export interface SkillExecutorClients {
  readonly primary: ChatService;
  readonly fallback?: ChatService;
}

export const makeWorkersAiSkillExecutor = (
  clients: SkillExecutorClients
): SkillExecutorService => ({
  execute: ({ skillMarkdown, inputText, gatewayMetadata }) => {
    const baseRequest = {
      system: buildSkillSystem(skillMarkdown),
      message: buildSkillUserMessage(inputText),
    };
    const fallback = clients.fallback;
    const primaryRequest = {
      ...baseRequest,
      ...(gatewayMetadata ? { gatewayMetadata: { ...gatewayMetadata, role: "primary" } } : {}),
    };
    const withFallback = fallback
      ? clients.primary.transformText(primaryRequest).pipe(
          Effect.withSpan("ai.skill.execute.primary"),
          Effect.catch(() =>
            fallback
              .transformText({
                ...baseRequest,
                ...(gatewayMetadata
                  ? { gatewayMetadata: { ...gatewayMetadata, role: "fallback" } }
                  : {}),
              })
              .pipe(Effect.withSpan("ai.skill.execute.fallback"))
          )
        )
      : clients.primary
          .transformText(primaryRequest)
          .pipe(Effect.withSpan("ai.skill.execute.primary"));
    return withFallback.pipe(
      Effect.mapError((e) => new SkillExecutionError({ message: unknownMessage(e) })),
      Effect.map((text) => text.trim()),
      Effect.withSpan("ai.skill.execute", {
        attributes: { "ai.has_fallback": !!fallback },
      })
    );
  },
});
