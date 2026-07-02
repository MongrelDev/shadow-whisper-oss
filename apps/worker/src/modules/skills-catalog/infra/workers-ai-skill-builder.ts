import { Effect } from "effect";
import { generateText, jsonSchema, Output } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { SkillExecutionError } from "../errors";
import type { BuildSkillResult, SkillBuilderShape } from "../application/ports/skill-builder";
import { unknownMessage } from "../../../lib/unknown-message";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const MAX_OUTPUT_TOKENS = 2048;

const SYSTEM_PROMPT = `You are a skill builder for a voice transcription app called ShadowWhisper.

A "skill" is a markdown prompt that transforms raw voice transcriptions into polished text. When a user applies a skill, the transcription is fed to an LLM alongside the skill's markdown prompt, and the LLM produces the transformed output.

Given the user's natural language description of what they want a skill to do, generate:
1. **markdown**: The full skill prompt in markdown. Write clear instructions for an LLM that will receive raw transcribed text and must produce the transformed output. Be specific about tone, format, and rules. Do NOT include YAML frontmatter.
2. **displayName**: A short, human-readable name for the skill (2-4 words).
3. **description**: A one-sentence description of what the skill does.
4. **slug**: A URL-safe kebab-case identifier (e.g. "meeting-notes", "formal-email").
5. **triggers**: An array of 1-5 short voice trigger phrases the user might say to activate this skill (e.g. ["meeting notes", "notes"]).

Write the markdown prompt as if you are instructing another AI assistant. Start with "You are..." or "Your task is..." and be direct.`;

const outputSchema = jsonSchema<BuildSkillResult>({
  type: "object",
  properties: {
    markdown: { type: "string", description: "The full skill prompt in markdown" },
    displayName: { type: "string", description: "Short human-readable name" },
    description: { type: "string", description: "One-sentence description" },
    slug: { type: "string", description: "URL-safe kebab-case identifier" },
    triggers: {
      type: "array",
      items: { type: "string" },
      description: "Voice trigger phrases",
    },
  },
  required: ["markdown", "displayName", "description", "slug", "triggers"],
  additionalProperties: false,
});

export const makeWorkersAiSkillBuilder = (env: Env): SkillBuilderShape => {
  const provider = createWorkersAI({ binding: env.AI });
  const model = provider(MODEL, {
    gateway: {
      id: env.AI_GATEWAY_ID,
      metadata: { flow: "skills.build", model: MODEL },
    },
  });

  return {
    build: ({ description }) =>
      Effect.tryPromise({
        try: async () => {
          const result = await generateText({
            model,
            system: SYSTEM_PROMPT,
            prompt: description,
            temperature: 0.7,
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            output: Output.object({ schema: outputSchema }),
          });
          return result.output;
        },
        catch: (e) => new SkillExecutionError({ message: unknownMessage(e) }),
      }).pipe(
        Effect.withSpan("ai.skill.build", {
          attributes: { "ai.model": MODEL, "input.length": description.length },
        })
      ),
  };
};
