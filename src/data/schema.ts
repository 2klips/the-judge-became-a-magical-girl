import { z } from "zod";

export const emotions = [
  "neutral",
  "happy",
  "shy",
  "upset",
  "surprised",
] as const;

export const emotionSchema = z.enum(emotions);
const idSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const flagSchema = z.string().regex(/^[a-z][a-z0-9_]*$/);
const dialogueLineSchema = z.string().min(1).max(80);

const sceneSchema = z
  .object({
    bg: z.string().min(1),
    bgm: z.string().min(1).optional(),
  })
  .strict();

export const lineSchema = z
  .object({
    speaker: z.string().min(1),
    text: dialogueLineSchema,
    emotion: emotionSchema.optional(),
  })
  .strict();

export const intentSchema = z
  .object({
    id: idSchema,
    clickLabel: z.string().min(1).max(80),
    examples: z.array(z.string().min(1)).min(2),
    keywords: z.array(z.string().min(1)).min(1).max(8),
    affinityDelta: z.number().int().min(-3).max(3),
    setFlags: z.array(flagSchema),
    npcEmotion: emotionSchema,
    offlineReply: dialogueLineSchema,
    next: idSchema.nullable(),
  })
  .strict();

const conditionalExitSchema = z
  .object({ if: z.string().min(1), next: idSchema })
  .strict();
const defaultExitSchema = z.object({ default: idSchema }).strict();

export const exitRuleSchema = z.union([
  conditionalExitSchema,
  defaultExitSchema,
]);

export const dialogueNodeSchema = z
  .object({
    nodeId: idSchema,
    type: z.literal("dialogue"),
    scene: sceneSchema,
    npc: z
      .object({ id: idSchema, startEmotion: emotionSchema })
      .strict(),
    objective: z.string().min(1),
    opening: dialogueLineSchema,
    llmContext: z.string().min(1),
    maxTurns: z.number().int().min(1).max(10),
    intents: z.array(intentSchema).length(3),
    allowedFlags: z.array(flagSchema),
    fallbackReplies: z.array(dialogueLineSchema).min(2).max(3),
    exitOnMaxTurns: z.array(exitRuleSchema).min(1),
  })
  .strict()
  .superRefine((node, context) => {
    const lastRule = node.exitOnMaxTurns.at(-1);
    if (!lastRule || !("default" in lastRule)) {
      context.addIssue({
        code: "custom",
        path: ["exitOnMaxTurns"],
        message: "마지막 탈출 규칙은 default여야 합니다.",
      });
    }

    node.exitOnMaxTurns.slice(0, -1).forEach((rule, index) => {
      if ("default" in rule) {
        context.addIssue({
          code: "custom",
          path: ["exitOnMaxTurns", index],
          message: "default 규칙은 마지막에만 둘 수 있습니다.",
        });
      }
    });
  });

export const cutsceneNodeSchema = z
  .object({
    nodeId: idSchema,
    type: z.literal("cutscene"),
    scene: sceneSchema,
    lines: z.array(lineSchema).min(1),
    next: idSchema,
  })
  .strict();

export const endingNodeSchema = z
  .object({
    nodeId: idSchema,
    type: z.literal("ending"),
    scene: sceneSchema,
    endingId: z.enum(["good", "normal", "bad", "hidden"]),
    lines: z.array(lineSchema).min(1),
  })
  .strict();

export const nodeSchema = z.discriminatedUnion("type", [
  dialogueNodeSchema,
  cutsceneNodeSchema,
  endingNodeSchema,
]);

export const scenarioSchema = z.array(nodeSchema).min(1);

export const characterSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1).max(30),
    role: z.string().min(1),
    traits: z.array(z.string().min(1)).length(3),
    speechRules: z.array(z.string().min(1)).min(1),
    taboos: z.array(z.string().min(1)).min(1),
    sampleLines: z.array(dialogueLineSchema).length(5),
    emotions: z.array(emotionSchema).length(5),
  })
  .strict();

export const charactersSchema = z.array(characterSchema).min(1);

export const configSchema = z
  .object({
    schemaVersion: z.literal(1),
    startNodeId: idSchema,
    initialAffinity: z.number().int().min(0).max(100),
    totalTurnLimit: z.number().int().min(1).max(100),
    finalConvergenceNodeId: idSchema,
    allowedFlags: z.array(flagSchema),
  })
  .strict();

export type Emotion = z.infer<typeof emotionSchema>;
export type Intent = z.infer<typeof intentSchema>;
export type ExitRule = z.infer<typeof exitRuleSchema>;
export type DialogueNode = z.infer<typeof dialogueNodeSchema>;
export type CutsceneNode = z.infer<typeof cutsceneNodeSchema>;
export type EndingNode = z.infer<typeof endingNodeSchema>;
export type ScenarioNode = z.infer<typeof nodeSchema>;
export type Character = z.infer<typeof characterSchema>;
export type GameConfig = z.infer<typeof configSchema>;

export interface GameData {
  scenario: ScenarioNode[];
  characters: Character[];
  config: GameConfig;
}
