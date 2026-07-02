import { Effect } from "effect";
import type {
  ChatCompletion,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";
import { unknownMessage } from "../../../lib/unknown-message";
import { REQUEST_TIMEOUT_MS, withRequestTimeout } from "../../../lib/request-timeout";
import type { InstalledSkillSummary } from "../../skills-catalog/domain/installed-skill";
import type { SkillRepositoryService } from "../../skills/application/ports/skill-repository";
import type { TranscriptOperation } from "../domain/operations";
import {
  gatewayMetadataHeaders,
  isRetryableGroqError,
  makeGroqClient,
} from "../../../platform/cloudflare/workers-ai/groq-client";
import { TextImproverError } from "../application/ports/text-improver";
import type {
  GenerateTextRequest,
  TextGeneratorService,
} from "../application/ports/text-generator";
import { resolveSelection } from "./tools/resolve-selection";

const GROQ_LLM_MODEL = "llama-3.3-70b-versatile";
const MAX_OUTPUT_TOKENS = 2048;

const APPLY_OPERATION_TOOL: ChatCompletionTool = {
  type: "function",
  function: {
    name: "applyOperation",
    description:
      "Apply a transcript operation or a voice-activated user skill by its id. Call this only when the speaker's intent clearly calls for an operation, or when they explicitly request a skill. The returned skillMarkdown contains instructions that REPLACE the default cleanup task — follow them as your new guidelines for processing the transcript.",
    parameters: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The exact id of the operation or installed skill to apply.",
        },
      },
      required: ["id"],
      additionalProperties: false,
    },
  },
};

const content = (message?: { readonly content?: string | null }): string =>
  (message?.content ?? "").trim();

const prepare = (req: GenerateTextRequest) => {
  const operations = req.routing?.operations ?? [];
  const installed = req.routing?.installed ?? [];
  const withTools = req.routing !== undefined;
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: req.system },
    { role: "user", content: req.prompt },
  ];
  return { operations, installed, withTools, messages };
};

export const makeGroqTextGenerator = (
  env: Env,
  skillLoader: SkillRepositoryService
): TextGeneratorService => {
  const client = makeGroqClient(env);

  const callGroq = (
    messages: ChatCompletionMessageParam[],
    withTools: boolean,
    userId: string
  ): Effect.Effect<ChatCompletion, TextImproverError> =>
    Effect.tryPromise({
      try: () =>
        client.chat.completions.create(
          {
            model: GROQ_LLM_MODEL,
            messages,
            ...(withTools ? { tools: [APPLY_OPERATION_TOOL], tool_choice: "auto" as const } : {}),
            temperature: 0,
            max_tokens: MAX_OUTPUT_TOKENS,
          },
          { headers: gatewayMetadataHeaders(GROQ_LLM_MODEL, { userId, stage: "improve" }) }
        ),
      catch: (e) => {
        const retryable = isRetryableGroqError(e);
        return new TextImproverError({
          message: `[${GROQ_LLM_MODEL}] ${unknownMessage(e)}`,
          ...(retryable !== undefined ? { retryable } : {}),
        });
      },
    });

  const runToolCall = Effect.fnUntraced(function* (
    call: ChatCompletionMessageToolCall,
    operations: readonly TranscriptOperation[],
    installed: InstalledSkillSummary[]
  ) {
    const id = parseId(call.function.arguments);
    const loaded = id
      ? yield* resolveSelection(id, { operations, installed, skillLoader })
      : { skillMarkdown: null, skillName: null };

    yield* Effect.logInfo("Groq applied operation", {
      model: GROQ_LLM_MODEL,
      id,
      skillName: loaded.skillName,
      loaded: loaded.skillMarkdown !== null,
    });

    return {
      role: "tool" as const,
      tool_call_id: call.id,
      // @effect-diagnostics-next-line preferSchemaOverJson:off
      content: JSON.stringify(loaded),
    } satisfies ChatCompletionMessageParam;
  });

  const warnIfTruncated = (choice: ChatCompletion["choices"][number] | undefined) =>
    choice?.finish_reason === "length"
      ? Effect.logWarning("Groq text improvement truncated at token cap", {
          model: GROQ_LLM_MODEL,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        })
      : Effect.void;

  // Second (final) turn with the tool results — mirrors AI SDK stepCountIs(2).
  const runToolTurn = Effect.fnUntraced(function* (
    messages: ChatCompletionMessageParam[],
    choice: ChatCompletion["choices"][number],
    toolCalls: ChatCompletionMessageToolCall[],
    operations: readonly TranscriptOperation[],
    installed: InstalledSkillSummary[],
    userId: string
  ) {
    const toolMessages = yield* Effect.forEach(toolCalls, (call) =>
      runToolCall(call, operations, installed)
    );
    const second = yield* callGroq(
      [
        ...messages,
        { role: "assistant", content: choice.message.content, tool_calls: toolCalls },
        ...toolMessages,
      ],
      true,
      userId
    );
    const finalChoice = second.choices[0];
    yield* warnIfTruncated(finalChoice);
    return content(finalChoice?.message);
  });

  return {
    generate: Effect.fnUntraced(
      function* (req: GenerateTextRequest) {
        const { operations, installed, withTools, messages } = prepare(req);

        const first = yield* callGroq(messages, withTools, req.userId);
        const choice = first.choices[0];
        if (!choice) {
          return yield* new TextImproverError({
            message: `[${GROQ_LLM_MODEL}] empty response`,
          });
        }

        const toolCalls = withTools ? (choice.message.tool_calls ?? []) : [];
        if (toolCalls.length === 0) {
          yield* warnIfTruncated(choice);
          return content(choice.message);
        }

        return yield* runToolTurn(messages, choice, toolCalls, operations, installed, req.userId);
      },
      withRequestTimeout(
        () =>
          new TextImproverError({
            message: `[${GROQ_LLM_MODEL}] request timed out after ${REQUEST_TIMEOUT_MS}ms`,
            retryable: true,
          })
      )
    ),
  };
};

const parseId = (args: string): string | null => {
  try {
    const parsed = JSON.parse(args) as { id?: unknown };
    return typeof parsed.id === "string" ? parsed.id : null;
  } catch {
    return null;
  }
};
