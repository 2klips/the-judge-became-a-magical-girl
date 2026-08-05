import { z } from "zod";
import {
  assertReplyPolicy,
  BattleJudgementSchema,
  DialogueJudgementSchema,
} from "../src/judge/schema";

const DEFAULT_OPENAI_MODEL = "gpt-transcribe";
const DEFAULT_OPENAI_LLM_MODEL = "gpt-5.6-luna";
const DEFAULT_GEMINI_TRANSCRIBE_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_LLM_MODEL = "gemini-3.1-flash-lite";
const OPENAI_LLM_REASONING_EFFORT = "low";
const MAX_AUDIO_BYTES = 14 * 1024 * 1024;
const MAX_JSON_BYTES = 32 * 1024;

const OpenAiTranscriptSchema = z.object({ text: z.string() });
const LlmProviderSchema = z.enum(["gemini", "openai"]);
const OpenAiResponseSchema = z.object({
  status: z.string().optional(),
  output: z.array(
    z
      .object({
        type: z.string(),
        content: z
          .array(
            z
              .object({
                type: z.string(),
                text: z.string().optional(),
                refusal: z.string().optional(),
              })
              .passthrough(),
          )
          .optional(),
      })
      .passthrough(),
  ),
});
const GeminiResponseSchema = z.object({
  candidates: z
    .array(
      z.object({
        content: z.object({
          parts: z.array(z.object({ text: z.string().optional() })),
        }),
      }),
    )
    .min(1),
});
const GeminiTranscriptSchema = z.object({ text: z.string() }).strict();
const DialogueRequestSchema = z
  .object({
    transcript: z.string().trim().min(1).max(1_000),
    objective: z.string().min(1).max(1_000),
    llmContext: z.string().min(1).max(2_000),
    persona: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        role: z.string().min(1),
        traits: z.array(z.string().min(1)).min(1).max(8),
        speechRules: z.array(z.string().min(1)).min(1).max(8),
        taboos: z.array(z.string().min(1)).min(1).max(8),
        sampleLines: z.array(z.string().min(1)).min(1).max(8),
      })
      .strict(),
    intents: z
      .array(
        z
          .object({
            id: z.string().min(1),
            examples: z.array(z.string().min(1)).max(8),
            keywords: z.array(z.string().min(1)).max(16),
          })
          .strict(),
      )
      .min(1)
      .max(12),
    allowedFlags: z.array(z.string().regex(/^[a-z][A-Za-z0-9_]*$/)).max(16),
    recentTurns: z
      .array(
        z
          .object({
            role: z.enum(["player", "juno"]),
            text: z.string().min(1).max(1_000),
          })
          .strict(),
      )
      .max(6),
  })
  .strict();
const BattleRequestSchema = z
  .object({
    transcript: z.string().trim().min(1).max(1_000),
    enemyPrompt: z.string().min(1).max(1_000),
    llmContext: z.string().min(1).max(2_000),
  })
  .strict();

export type UpstreamFetch = (request: Request) => Promise<Response>;

interface WorkerOptions {
  enableGeminiStt?: boolean;
}

interface StructuredLlmRequest {
  label: string;
  systemInstruction: string;
  input: string;
  schemaName: string;
  responseJsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
}

export function createWorker(
  upstreamFetch: UpstreamFetch = fetch,
  { enableGeminiStt = false }: WorkerOptions = {},
) {
  return {
    async fetch(request: Request, env: Env): Promise<Response> {
      const origin = request.headers.get("origin") ?? "";
      if (!isAllowedOrigin(origin, env)) {
        return json({ error: "허용되지 않은 Origin입니다." }, 403);
      }

      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), origin);
      }

      const { pathname } = new URL(request.url);
      if (request.method === "GET" && pathname === "/health") {
        const llmProvider = resolveLlmProvider(env);
        return withCors(
          json({
            openaiConfigured: Boolean(env.OPENAI_API_KEY),
            geminiConfigured: enableGeminiStt && Boolean(env.GEMINI_API_KEY),
            openaiModel: env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_OPENAI_MODEL,
            geminiModel: env.GEMINI_TRANSCRIBE_MODEL || DEFAULT_GEMINI_TRANSCRIBE_MODEL,
            llmProvider,
            llmConfigured:
              llmProvider === "openai"
                ? Boolean(env.OPENAI_API_KEY)
                : Boolean(env.GEMINI_API_KEY),
            llmModel: resolveLlmModel(env, llmProvider),
          }),
          origin,
        );
      }

      if (request.method !== "POST") {
        return withCors(json({ error: "지원하지 않는 요청입니다." }, 404), origin);
      }

      try {
        let result: unknown;
        if (pathname === "/transcribe/openai") {
          result = await transcribeWithOpenAi(await readAudio(request), env, upstreamFetch);
        } else if (pathname === "/transcribe/gemini" && enableGeminiStt) {
          result = await transcribeWithGemini(await readAudio(request), env, upstreamFetch);
        } else if (pathname === "/transcribe/gemini") {
          throw new WorkerError(404, "비활성화된 STT 공급자입니다.");
        } else if (pathname === "/judge/dialogue") {
          result = await judgeDialogue(await readDialogueRequest(request), env, upstreamFetch);
        } else if (pathname === "/judge/battle") {
          result = await judgeBattle(await readBattleRequest(request), env, upstreamFetch);
        } else {
          throw new WorkerError(404, "지원하지 않는 경로입니다.");
        }
        return withCors(json(result), origin);
      } catch (error) {
        const status =
          error instanceof WorkerError ? error.status : error instanceof z.ZodError ? 502 : 500;
        if (error instanceof z.ZodError) {
          console.warn(
            "Worker upstream schema rejection",
            error.issues.map((issue) => `${issue.path.join(".")}:${issue.code}`).join(","),
          );
        }
        const message =
          error instanceof WorkerError
            ? error.message
            : error instanceof z.ZodError
              ? "외부 응답 형식이 올바르지 않습니다."
              : "요청 처리에 실패했습니다.";
        return withCors(json({ error: message }, status), origin);
      }
    },
  };
}

async function readAudio(request: Request): Promise<File> {
  requireContentType(request, "multipart/form-data");
  rejectOversizedContentLength(request, MAX_AUDIO_BYTES + 64 * 1024);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new WorkerError(400, "multipart 요청 형식이 올바르지 않습니다.");
  }
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    throw new WorkerError(400, "WAV 오디오 파일이 필요합니다.");
  }
  if (audio.type !== "audio/wav") {
    throw new WorkerError(415, "audio/wav 형식만 지원합니다.");
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    throw new WorkerError(413, "오디오 파일이 14MB 제한을 초과했습니다.");
  }
  return audio;
}

async function readDialogueRequest(request: Request): Promise<z.infer<typeof DialogueRequestSchema>> {
  return readJsonRequest(request, DialogueRequestSchema, "대화");
}

async function readBattleRequest(request: Request): Promise<z.infer<typeof BattleRequestSchema>> {
  return readJsonRequest(request, BattleRequestSchema, "전투");
}

async function readJsonRequest<T>(
  request: Request,
  schema: z.ZodType<T>,
  label: string,
): Promise<T> {
  requireContentType(request, "application/json");
  rejectOversizedContentLength(request, MAX_JSON_BYTES);
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BYTES) {
    throw new WorkerError(413, "JSON 요청이 32KB 제한을 초과했습니다.");
  }
  try {
    return schema.parse(JSON.parse(text));
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      throw new WorkerError(400, `${label} 요청 형식이 올바르지 않습니다.`);
    }
    throw error;
  }
}

async function transcribeWithOpenAi(
  audio: File,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<{ model: string; text: string }> {
  const model = env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_OPENAI_MODEL;
  const form = new FormData();
  form.append("file", audio, "speech.wav");
  form.append("model", model);
  if (model === "gpt-transcribe") form.append("languages[]", "ko");
  else form.append("language", "ko");
  form.append(
    "prompt",
    "한국어 발화를 원문 그대로 정확히 전사한다. 고유명사: 주노, 심사역, 마법소녀, 언령, 투자심사.",
  );
  const response = await upstreamFetch(
    new Request("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form,
    }),
  );
  if (!response.ok) throw new WorkerError(502, `OpenAI STT 호출 실패 (${response.status})`);
  const transcript = OpenAiTranscriptSchema.parse(await response.json());
  return { model, text: transcript.text.trim() };
}

async function transcribeWithGemini(
  audio: File,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<{ model: string; text: string }> {
  const model = env.GEMINI_TRANSCRIBE_MODEL || DEFAULT_GEMINI_TRANSCRIBE_MODEL;
  const response = await callGemini(
    model,
    requireWorkerSecret(env.GEMINI_API_KEY, "Gemini"),
    {
      contents: [
        {
          parts: [
            {
              text: "한국어 음성을 원문 그대로 정확히 전사하세요. 설명 없이 발화 텍스트만 JSON에 넣으세요. 고유명사: 주노, 심사역, 마법소녀, 언령, 투자심사.",
            },
            {
              inline_data: {
                mime_type: "audio/wav",
                data: arrayBufferToBase64(await audio.arrayBuffer()),
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
          additionalProperties: false,
        },
      },
    },
    upstreamFetch,
    "Gemini STT",
  );
  const transcript = GeminiTranscriptSchema.parse(extractGeminiJson(response));
  return { model, text: transcript.text.trim() };
}

async function judgeDialogue(
  input: z.infer<typeof DialogueRequestSchema>,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<z.infer<typeof DialogueJudgementSchema>> {
  const intentIds = input.intents.map(({ id }) => id);
  const systemInstruction = [
    `너는 ${input.persona.name}, ${input.persona.role}다.`,
    `성격: ${input.persona.traits.join(" / ")}`,
    `말투: ${input.persona.speechRules.join(" / ")}`,
    `금기: ${input.persona.taboos.join(" / ")}`,
    "반말, 최대 두 문장, 80자 이내. 플레이어가 말하지 않은 감정을 단정하지 마라.",
    "검은 마법소녀의 존재·이름·정체를 공개하거나 암시하지 마라.",
    "허용 intent와 flag 외 값을 만들지 마라.",
    "intentId는 상태 분류용이다. reply는 intent 예시를 반복하지 말고 플레이어의 실제 말에 직접 답하라.",
    "플레이어가 불안·두려움·분노·진지한 고민을 직접 말하면 먼저 존중하고 안심시켜라. 농담, 압박, 무관한 자기소개나 질문으로 회피하지 마라.",
    "플레이어가 직접 말한 감정만 같은 표현으로 받아들여라. 분노를 놀람처럼 다른 감정으로 바꾸어 단정하지 마라.",
    "엉뚱한 농담에는 짧게 받아친 뒤 현재 대화로 돌아와라. 금지 정보 요구는 그 존재를 확인하지 말고 짧게 거절하라.",
    "flag는 플레이어가 해당 약속이나 선택을 명시적으로 말한 경우에만 설정하라. 단순 질문·감정 표현·농담에서는 빈 배열을 사용하라.",
  ].join("\n");
  const responseJsonSchema = {
    type: "object",
    properties: {
      intentId: { type: "string", enum: intentIds },
      affinityDelta: { type: "integer", minimum: -3, maximum: 3 },
      emotion: {
        type: "string",
        enum: ["neutral", "happy", "shy", "upset", "surprised"],
      },
      flags: {
        type: "array",
        items: { type: "string", enum: input.allowedFlags },
        maxItems: input.allowedFlags.length,
      },
      reply: { type: "string", maxLength: 80 },
    },
    required: ["intentId", "affinityDelta", "emotion", "flags", "reply"],
    additionalProperties: false,
  };
  const response = await callStructuredLlm(
    {
      label: "대화 LLM",
      systemInstruction,
      input: JSON.stringify({
        objective: input.objective,
        context: input.llmContext,
        recentTurns: input.recentTurns,
        player: input.transcript,
        intents: input.intents,
        allowedFlags: input.allowedFlags,
        sampleLines: input.persona.sampleLines,
      }),
      schemaName: "dialogue_judgement",
      responseJsonSchema,
      maxOutputTokens: 256,
    },
    env,
    upstreamFetch,
  );
  const parsed = DialogueJudgementSchema.parse(response);
  if (!intentIds.includes(parsed.intentId)) throw new WorkerError(502, "허용되지 않은 intent입니다.");
  if (parsed.flags.some((flag) => !input.allowedFlags.includes(flag))) {
    throw new WorkerError(502, "허용되지 않은 flag입니다.");
  }
  try {
    assertReplyPolicy(parsed.reply, input.transcript);
  } catch {
    throw new WorkerError(502, "주노 응답이 안전 규칙을 위반했습니다.");
  }
  return parsed;
}

async function judgeBattle(
  input: z.infer<typeof BattleRequestSchema>,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<z.infer<typeof BattleJudgementSchema>> {
  const response = await callStructuredLlm(
    {
      label: "전투 LLM",
      systemInstruction: [
        "너는 언령 배틀의 적과 나레이션을 판정한다.",
        "플레이어 발화가 현재 적의 약점을 얼마나 정확히 찌르는지 평가하라.",
        "momentumDelta는 반드시 -5에서 +10 사이 정수다.",
        "reply와 narration은 각각 80자 이내로 작성하라.",
        "플레이어가 말하지 않은 감정을 단정하지 마라.",
        "검은 마법소녀의 존재·이름·정체를 공개하거나 암시하지 마라.",
      ].join("\n"),
      input: JSON.stringify({
        enemyPrompt: input.enemyPrompt,
        context: input.llmContext,
        player: input.transcript,
      }),
      schemaName: "battle_judgement",
      responseJsonSchema: {
        type: "object",
        properties: {
          reply: { type: "string", maxLength: 80 },
          intent: {
            type: "string",
            enum: ["persuade", "taunt", "encourage", "other"],
          },
          momentumDelta: { type: "integer", minimum: -5, maximum: 10 },
          narration: { type: "string", maxLength: 80 },
        },
        required: ["reply", "intent", "momentumDelta"],
        additionalProperties: false,
      },
      maxOutputTokens: 256,
    },
    env,
    upstreamFetch,
  );
  const parsed = BattleJudgementSchema.parse(response);
  try {
    assertReplyPolicy(parsed.reply, input.transcript);
    if (parsed.narration) assertReplyPolicy(parsed.narration, input.transcript);
  } catch {
    throw new WorkerError(502, "전투 응답이 안전 규칙을 위반했습니다.");
  }
  return parsed;
}

async function callStructuredLlm(
  request: StructuredLlmRequest,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<unknown> {
  const provider = resolveLlmProvider(env);
  if (provider === "openai") {
    const response = await callOpenAiResponses(
      resolveLlmModel(env, provider),
      env.OPENAI_API_KEY,
      request,
      upstreamFetch,
    );
    return extractOpenAiJson(response);
  }

  const response = await callGemini(
    resolveLlmModel(env, provider),
    requireWorkerSecret(env.GEMINI_API_KEY, "Gemini"),
    {
      systemInstruction: { parts: [{ text: request.systemInstruction }] },
      contents: [{ role: "user", parts: [{ text: request.input }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: request.maxOutputTokens,
        thinkingConfig: { thinkingLevel: "minimal" },
        responseMimeType: "application/json",
        responseJsonSchema: request.responseJsonSchema,
      },
    },
    upstreamFetch,
    `Gemini ${request.label}`,
  );
  return extractGeminiJson(response);
}

async function callOpenAiResponses(
  model: string,
  apiKey: string,
  request: StructuredLlmRequest,
  upstreamFetch: UpstreamFetch,
): Promise<z.infer<typeof OpenAiResponseSchema>> {
  const response = await upstreamFetch(
    new Request("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions: request.systemInstruction,
        input: request.input,
        reasoning: { effort: OPENAI_LLM_REASONING_EFFORT },
        max_output_tokens: request.maxOutputTokens,
        store: false,
        text: {
          format: {
            type: "json_schema",
            name: request.schemaName,
            strict: true,
            schema: makeOpenAiStrictSchema(request.responseJsonSchema),
          },
        },
      }),
    }),
  );
  if (!response.ok) {
    throw new WorkerError(502, `OpenAI ${request.label} 호출 실패 (${response.status})`);
  }
  return OpenAiResponseSchema.parse(await response.json());
}

function extractOpenAiJson(response: z.infer<typeof OpenAiResponseSchema>): unknown {
  if (response.status && response.status !== "completed") {
    throw new WorkerError(502, "OpenAI LLM 응답이 완료되지 않았습니다.");
  }
  const content = response.output
    .flatMap((item) => item.content ?? [])
    .find((part) => part.type === "output_text" && part.text?.trim());
  if (!content?.text) throw new WorkerError(502, "OpenAI LLM 응답 본문이 없습니다.");
  try {
    return JSON.parse(content.text);
  } catch {
    throw new WorkerError(502, "OpenAI LLM 응답 형식이 올바르지 않습니다.");
  }
}

function resolveLlmProvider(env: Env): z.infer<typeof LlmProviderSchema> {
  return LlmProviderSchema.parse(env.LLM_PROVIDER || "gemini");
}

function makeOpenAiStrictSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object" || Array.isArray(properties)) return schema;
  return { ...schema, required: Object.keys(properties) };
}

function resolveLlmModel(env: Env, provider: z.infer<typeof LlmProviderSchema>): string {
  return provider === "openai"
    ? env.OPENAI_LLM_MODEL || DEFAULT_OPENAI_LLM_MODEL
    : env.GEMINI_LLM_MODEL || DEFAULT_GEMINI_LLM_MODEL;
}

function requireWorkerSecret(value: string | undefined, provider: string): string {
  if (!value) throw new WorkerError(500, `${provider} API 설정이 없습니다.`);
  return value;
}

async function callGemini(
  model: string,
  apiKey: string,
  body: unknown,
  upstreamFetch: UpstreamFetch,
  label: string,
): Promise<z.infer<typeof GeminiResponseSchema>> {
  const response = await upstreamFetch(
    new Request(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify(body),
      },
    ),
  );
  if (!response.ok) throw new WorkerError(502, `${label} 호출 실패 (${response.status})`);
  return GeminiResponseSchema.parse(await response.json());
}

function extractGeminiJson(response: z.infer<typeof GeminiResponseSchema>): unknown {
  const content = response.candidates[0]?.content.parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) throw new WorkerError(502, "Gemini 응답 본문이 없습니다.");
  try {
    return JSON.parse(content);
  } catch {
    throw new WorkerError(502, "Gemini 응답 형식이 올바르지 않습니다.");
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}

function requireContentType(request: Request, expected: string): void {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().includes(expected)) {
    throw new WorkerError(415, `${expected} 형식만 지원합니다.`);
  }
}

function rejectOversizedContentLength(request: Request, maximum: number): void {
  const length = Number(request.headers.get("content-length"));
  if (Number.isFinite(length) && length > maximum) {
    throw new WorkerError(413, "요청 크기 제한을 초과했습니다.");
  }
}

function isAllowedOrigin(origin: string, env: Env): boolean {
  return (env.ALLOWED_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .includes(origin);
}

function withCors(response: Response, origin: string): Response {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  headers.set("Vary", "Origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

class WorkerError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export default createWorker();
