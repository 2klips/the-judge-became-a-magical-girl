import { z } from "zod";
import { emotionSchema, type DialogueNode } from "../data/schema";

export const DialogueJudgementSchema = z
  .object({
    intentId: z.string().min(1),
    affinityDelta: z.number().int().min(-3).max(3),
    emotion: emotionSchema,
    flags: z.array(z.string().regex(/^[a-z][A-Za-z0-9_]*$/)).max(8),
    reply: z
      .string()
      .min(1)
      .refine((value) => Array.from(value).length <= 80, "응답은 80자 이하여야 합니다.")
      .refine((value) => sentenceCount(value) <= 2, "응답은 최대 두 문장이어야 합니다."),
  })
  .strict();

export type DialogueJudgementResult = z.infer<typeof DialogueJudgementSchema>;

export const BattleJudgementSchema = z
  .object({
    reply: z
      .string()
      .min(1)
      .refine((value) => Array.from(value).length <= 80, "응답은 80자 이하여야 합니다."),
    intent: z.enum(["persuade", "taunt", "encourage", "other"]),
    momentumDelta: z.number().int().min(-5).max(10),
    narration: z
      .string()
      .min(1)
      .refine((value) => Array.from(value).length <= 80, "상황 묘사는 80자 이하여야 합니다.")
      .optional(),
  })
  .strict();

export type BattleJudgementResult = z.infer<typeof BattleJudgementSchema>;

export function parseBattleJudgement(
  input: unknown,
  transcript: string,
): BattleJudgementResult {
  const parsed = BattleJudgementSchema.parse(input);
  assertReplyPolicy(parsed.reply, transcript);
  if (parsed.narration) assertReplyPolicy(parsed.narration, transcript);
  return parsed;
}

const emotionClaims = [
  {
    reply: /(?:화났(?:구나|지|겠)|화가\s*났(?:구나|지|겠)|짜증(?:이\s*)?났(?:구나|지|겠))/u,
    transcript: /화나|화가 나|짜증/u,
  },
  {
    reply: /(?:슬프(?:구나|지|겠)|우울하(?:구나|지|겠))/u,
    transcript: /슬프|우울/u,
  },
  {
    reply: /(?:불안하(?:구나|지|겠)|두렵(?:구나|지|겠)|무섭(?:구나|지|겠)|무서웠(?:구나|지|겠))/u,
    transcript: /불안|두려|무서/u,
  },
  {
    reply: /(?:기쁘(?:구나|지|겠)|신났(?:구나|지|겠))/u,
    transcript: /기쁘|신나/u,
  },
  {
    reply: /(?:놀랐(?:구나|지|겠)|당황했(?:구나|지|겠))/u,
    transcript: /놀라|놀랐|당황/u,
  },
  {
    reply: /(?:지쳤(?:구나|지|겠)|힘들었(?:구나|지|겠))/u,
    transcript: /지쳐|지쳤|힘들/u,
  },
] as const;

export function parseDialogueJudgementForNode(
  input: unknown,
  node: DialogueNode,
  transcript: string,
): DialogueJudgementResult {
  const parsed = DialogueJudgementSchema.parse(input);
  if (!node.intents.some((intent) => intent.id === parsed.intentId)) {
    throw new Error(`허용되지 않은 intent입니다: ${parsed.intentId}`);
  }
  assertReplyPolicy(parsed.reply, transcript);
  assertDialogueReplyQuality(parsed.reply, transcript);
  return parsed;
}

export function assertReplyPolicy(reply: string, transcript: string): void {
  if (/검은\s*마법소녀/u.test(reply)) {
    throw new Error("스토리 금기: 검은 마법소녀의 정체를 공개할 수 없습니다.");
  }
  for (const claim of emotionClaims) {
    if (claim.reply.test(reply) && !claim.transcript.test(transcript)) {
      throw new Error("플레이어가 말하지 않은 감정을 단정할 수 없습니다.");
    }
  }
}

const dialogueMetaReplyPatterns = [
  /이건\s+.{0,30}묻는\s+거(?:네|야)/u,
  /(?:질문|의도)(?:를|는|이)?\s*(?:분류|정리|파악|확인)(?:해|하)/u,
] as const;
const dialogueEvasiveReplyPattern =
  /(?:같이\s*)?(?:얘기|이야기)해\s*보자|(?:깔끔히\s*)?정리해\s*보자/u;
const dialogueMalformedReplyPattern = /(?:맞설|막을|지킬|함께할)\s+연다/u;
const directQuestionPattern = /누구|어디|왜|어떻게|뭐\s*때문/u;

export function assertDialogueReplyQuality(reply: string, transcript: string): void {
  if (dialogueMetaReplyPatterns.some((pattern) => pattern.test(reply))) {
    throw new Error("응답 품질: 질문을 재분류하는 meta 응답은 허용되지 않습니다.");
  }
  if (dialogueMalformedReplyPattern.test(reply)) {
    throw new Error("응답 품질: 문법적으로 완결되지 않은 응답입니다.");
  }
  if (directQuestionPattern.test(transcript) && dialogueEvasiveReplyPattern.test(reply)) {
    throw new Error("응답 품질: 직접 질문을 회피하는 응답입니다.");
  }
  if (/어디/u.test(transcript) && /왜\s*(?:이동|움직)|선택\s*이유/u.test(reply)) {
    throw new Error("응답 품질: 장소 질문에 이유로 답한 문맥 불일치입니다.");
  }
}

function sentenceCount(value: string): number {
  const separated = value
    .split(/[.!?。！？]+/u)
    .map((part) => part.trim())
    .filter(Boolean).length;
  return separated || (value.trim() ? 1 : 0);
}
