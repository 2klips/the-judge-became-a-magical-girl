import { z } from "zod";
import {
  assertReplyPolicy,
  BattleJudgementSchema,
  DialogueJudgementSchema,
} from "../src/judge/schema";

const DEFAULT_OPENAI_MODEL = "gpt-transcribe";
const OPENAI_LIVE_TRANSCRIBE_MODEL = "gpt-live-transcribe";
const DEFAULT_OPENAI_REALTIME_MODEL = "gpt-realtime-2.1-mini";
const OPENAI_REALTIME_TRANSCRIPTION_URL =
  "https://api.openai.com/v1/realtime?intent=transcription";
const DEFAULT_OPENAI_LLM_MODEL = "gpt-5.6-luna";
const DEFAULT_GEMINI_TRANSCRIBE_MODEL = "gemini-2.5-flash";
const DEFAULT_GEMINI_LLM_MODEL = "gemini-3.1-flash-lite";
const OPENAI_LLM_REASONING_EFFORT = "low";
const MAX_AUDIO_BYTES = 14 * 1024 * 1024;
const MAX_JSON_BYTES = 32 * 1024;
const REALTIME_TIMEOUT_MS = 12_000;
const REALTIME_PCM_SAMPLE_RATE = 24_000;
const REALTIME_PCM_CHUNK_BYTES = 48_000;

const OpenAiTranscriptSchema = z.object({ text: z.string() });
const OpenAiSttModelSchema = z.enum([
  DEFAULT_OPENAI_MODEL,
  OPENAI_LIVE_TRANSCRIBE_MODEL,
]);
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
const DialogueVoiceContextSchema = DialogueRequestSchema.omit({ transcript: true });
const BattleRequestSchema = z
  .object({
    transcript: z.string().trim().min(1).max(1_000),
    enemyPrompt: z.string().min(1).max(1_000),
    llmContext: z.string().min(1).max(2_000),
  })
  .strict();
const BattleVoiceContextSchema = BattleRequestSchema.omit({ transcript: true });
const RealtimeVoiceModeSchema = z.enum(["transcript", "dialogue", "battle"]);

export type UpstreamFetch = (request: Request) => Promise<Response>;

interface WorkerOptions {
  enableGeminiStt?: boolean;
  liveTranscribe?: OpenAiLiveTranscribe;
}

type OpenAiSttModel = z.infer<typeof OpenAiSttModelSchema>;

interface AudioRequest {
  readonly audio: File;
  readonly requestedModel?: string;
}

interface TranscriptionMetrics {
  readonly upstreamMs: number;
  readonly firstDeltaMs?: number;
}

interface TranscriptionResponse {
  readonly model: OpenAiSttModel;
  readonly text: string;
  readonly metrics: TranscriptionMetrics;
}

interface WorkerWebSocket extends EventTarget {
  accept(): void;
  send(message: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  addEventListener(type: "error" | "close", listener: () => void): void;
  removeEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  removeEventListener(type: "error" | "close", listener: () => void): void;
}

type OpenAiLiveTranscribe = (
  audio: File,
  env: Env,
  upstreamFetch: UpstreamFetch,
) => Promise<TranscriptionResponse>;

interface StructuredLlmRequest {
  label: string;
  systemInstruction: string;
  input: string;
  schemaName: string;
  responseJsonSchema: Record<string, unknown>;
  maxOutputTokens: number;
}

type RealtimeVoiceRequest =
  | { readonly mode: "transcript"; readonly audio: File }
  | {
      readonly mode: "dialogue";
      readonly audio: File;
      readonly context: z.infer<typeof DialogueVoiceContextSchema>;
    }
  | {
      readonly mode: "battle";
      readonly audio: File;
      readonly context: z.infer<typeof BattleVoiceContextSchema>;
    };

type RealtimeVoiceResponse =
  | {
      readonly mode: "transcript";
      readonly model: string;
      readonly text: string;
      readonly metrics: TranscriptionMetrics;
    }
  | {
      readonly mode: "dialogue";
      readonly model: string;
      readonly text: string;
      readonly judgement: z.infer<typeof DialogueJudgementSchema>;
      readonly metrics: TranscriptionMetrics;
    }
  | {
      readonly mode: "battle";
      readonly model: string;
      readonly text: string;
      readonly judgement: z.infer<typeof BattleJudgementSchema>;
      readonly metrics: TranscriptionMetrics;
    };

export function createWorker(
  upstreamFetch: UpstreamFetch = fetch,
  {
    enableGeminiStt = false,
    liveTranscribe = transcribeWithOpenAiRealtime,
  }: WorkerOptions = {},
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
            realtimeVoiceModel:
              env.OPENAI_REALTIME_MODEL || DEFAULT_OPENAI_REALTIME_MODEL,
            openaiSelectableModels:
              env.ENABLE_OPENAI_STT_MODEL_SELECTOR === "true"
                ? OpenAiSttModelSchema.options
                : [DEFAULT_OPENAI_MODEL],
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
          const input = await readAudio(request);
          const model = resolveOpenAiSttModel(input.requestedModel, env);
          result =
            model === OPENAI_LIVE_TRANSCRIBE_MODEL
              ? await liveTranscribe(input.audio, env, upstreamFetch)
              : await transcribeWithOpenAi(input.audio, env, upstreamFetch);
        } else if (pathname === "/transcribe/gemini" && enableGeminiStt) {
          result = await transcribeWithGemini((await readAudio(request)).audio, env, upstreamFetch);
        } else if (pathname === "/transcribe/gemini") {
          throw new WorkerError(404, "비활성화된 STT 공급자입니다.");
        } else if (pathname === "/voice/realtime") {
          result = await judgeVoiceWithOpenAiRealtime(
            await readRealtimeVoiceRequest(request),
            env,
            upstreamFetch,
          );
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

async function readAudio(request: Request): Promise<AudioRequest> {
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
  const requestedModel = form.get("model");
  if (requestedModel instanceof File) {
    throw new WorkerError(400, "STT 모델 형식이 올바르지 않습니다.");
  }
  return {
    audio,
    ...(typeof requestedModel === "string" ? { requestedModel } : {}),
  };
}

async function readRealtimeVoiceRequest(request: Request): Promise<RealtimeVoiceRequest> {
  requireContentType(request, "multipart/form-data");
  rejectOversizedContentLength(request, MAX_AUDIO_BYTES + MAX_JSON_BYTES + 64 * 1024);
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
  const modeValue = form.get("mode");
  if (modeValue instanceof File) {
    throw new WorkerError(400, "Realtime 음성 모드 형식이 올바르지 않습니다.");
  }
  const mode = RealtimeVoiceModeSchema.safeParse(modeValue);
  if (!mode.success) {
    throw new WorkerError(400, "지원하지 않는 Realtime 음성 모드입니다.");
  }
  if (mode.data === "transcript") return { mode: "transcript", audio };

  const contextValue = form.get("context");
  if (typeof contextValue !== "string") {
    throw new WorkerError(400, "Realtime 음성 판정 context가 필요합니다.");
  }
  if (new TextEncoder().encode(contextValue).byteLength > MAX_JSON_BYTES) {
    throw new WorkerError(413, "JSON 요청이 32KB 제한을 초과했습니다.");
  }
  let context: unknown;
  try {
    context = JSON.parse(contextValue);
  } catch {
    throw new WorkerError(400, "Realtime 음성 판정 context 형식이 올바르지 않습니다.");
  }
  if (mode.data === "dialogue") {
    const parsed = DialogueVoiceContextSchema.safeParse(context);
    if (!parsed.success) {
      throw new WorkerError(400, "대화 음성 판정 context 형식이 올바르지 않습니다.");
    }
    return { mode: "dialogue", audio, context: parsed.data };
  }
  const parsed = BattleVoiceContextSchema.safeParse(context);
  if (!parsed.success) {
    throw new WorkerError(400, "전투 음성 판정 context 형식이 올바르지 않습니다.");
  }
  return { mode: "battle", audio, context: parsed.data };
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
): Promise<TranscriptionResponse> {
  const model = DEFAULT_OPENAI_MODEL;
  const form = new FormData();
  form.append("file", audio, "speech.wav");
  form.append("model", model);
  if (model === "gpt-transcribe") form.append("languages[]", "ko");
  else form.append("language", "ko");
  form.append(
    "prompt",
    "한국어 발화를 원문 그대로 정확히 전사한다. 고유명사: 주노, 심사역, 마법소녀, 언령, 투자심사.",
  );
  const startedAt = performance.now();
  const response = await upstreamFetch(
    new Request("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form,
    }),
  );
  if (!response.ok) throw new WorkerError(502, `OpenAI STT 호출 실패 (${response.status})`);
  const transcript = OpenAiTranscriptSchema.parse(await response.json());
  return {
    model,
    text: transcript.text.trim(),
    metrics: { upstreamMs: elapsedMs(startedAt) },
  };
}

async function transcribeWithOpenAiRealtime(
  audio: File,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<TranscriptionResponse> {
  const pcm = await extractPcm16MonoWav(audio, REALTIME_PCM_SAMPLE_RATE);
  const startedAt = performance.now();
  const response = await upstreamFetch(
    new Request(
      OPENAI_REALTIME_TRANSCRIPTION_URL,
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          Upgrade: "websocket",
        },
      },
    ),
  );
  const socket = (
    response as Response & { readonly webSocket?: WorkerWebSocket | null }
  ).webSocket;
  if (!socket || response.status !== 101) {
    const diagnostic = await response.text().catch(() => "");
    console.warn(
      "OpenAI Realtime STT handshake failed",
      response.status,
      diagnostic.slice(0, 240),
    );
    throw new WorkerError(502, `OpenAI Realtime STT 연결 실패 (${response.status})`);
  }
  socket.accept();

  return new Promise<TranscriptionResponse>((resolve, reject) => {
    let transcript = "";
    let firstDeltaMs: number | undefined;
    let settled = false;
    const timer = setTimeout(
      () => fail(new WorkerError(504, "OpenAI Realtime STT 응답 시간이 초과되었습니다.")),
      REALTIME_TIMEOUT_MS,
    );

    const cleanup = (): void => {
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        socket.close(1011, "transcription failed");
      } catch {
        // 연결이 이미 닫힌 경우 무시한다.
      }
      reject(error);
    };
    const complete = (finalTranscript: string): void => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        socket.close(1000, "transcription complete");
      } catch {
        // 연결이 이미 닫힌 경우 무시한다.
      }
      resolve({
        model: OPENAI_LIVE_TRANSCRIBE_MODEL,
        text: finalTranscript.trim(),
        metrics: {
          upstreamMs: elapsedMs(startedAt),
          ...(firstDeltaMs === undefined ? {} : { firstDeltaMs }),
        },
      });
    };
    const onMessage = (event: MessageEvent): void => {
      if (typeof event.data !== "string") return;
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        fail(new WorkerError(502, "OpenAI Realtime STT 응답 형식이 올바르지 않습니다."));
        return;
      }
      if (!payload || typeof payload !== "object") return;
      const realtimeEvent = payload as {
        type?: string;
        delta?: string;
        transcript?: string;
        error?: { type?: string; code?: string; message?: string };
      };
      if (realtimeEvent.type === "conversation.item.input_audio_transcription.delta") {
        if (firstDeltaMs === undefined) firstDeltaMs = elapsedMs(startedAt);
        transcript += realtimeEvent.delta ?? "";
      } else if (
        realtimeEvent.type === "conversation.item.input_audio_transcription.completed"
      ) {
        complete(realtimeEvent.transcript ?? transcript);
      } else if (realtimeEvent.type === "error") {
        console.warn(
          "OpenAI Realtime STT event error",
          realtimeEvent.error?.type ?? "unknown_type",
          realtimeEvent.error?.code ?? "unknown_code",
          (realtimeEvent.error?.message ?? "unknown_message").slice(0, 240),
        );
        fail(new WorkerError(502, "OpenAI Realtime STT 호출에 실패했습니다."));
      }
    };
    const onError = (): void =>
      fail(new WorkerError(502, "OpenAI Realtime STT 연결 오류가 발생했습니다."));
    const onClose = (): void =>
      fail(new WorkerError(502, "OpenAI Realtime STT 연결이 일찍 종료되었습니다."));

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    try {
      socket.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "transcription",
            audio: {
              input: {
                format: { type: "audio/pcm", rate: REALTIME_PCM_SAMPLE_RATE },
                transcription: {
                  model: OPENAI_LIVE_TRANSCRIBE_MODEL,
                  prompt:
                    "한국어 발화를 원문 그대로 정확히 전사한다. 고유명사: 주노, 심사역, 마법소녀, 언령, 투자심사.",
                  keywords: ["주노", "심사역", "마법소녀", "언령", "투자심사"],
                  languages: ["ko"],
                  delay: "low",
                },
                turn_detection: null,
              },
            },
          },
        }),
      );
      for (let offset = 0; offset < pcm.length; offset += REALTIME_PCM_CHUNK_BYTES) {
        socket.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: bytesToBase64(pcm.subarray(offset, offset + REALTIME_PCM_CHUNK_BYTES)),
          }),
        );
      }
      socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
    } catch {
      fail(new WorkerError(502, "OpenAI Realtime STT 오디오 전송에 실패했습니다."));
    }
  });
}

async function judgeVoiceWithOpenAiRealtime(
  input: RealtimeVoiceRequest,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<RealtimeVoiceResponse> {
  const pcm = await extractPcm16MonoWav(input.audio, REALTIME_PCM_SAMPLE_RATE);
  const model = env.OPENAI_REALTIME_MODEL || DEFAULT_OPENAI_REALTIME_MODEL;
  if (model !== DEFAULT_OPENAI_REALTIME_MODEL) {
    throw new WorkerError(500, "지원하지 않는 Realtime 음성 모델 설정입니다.");
  }
  const response = await upstreamFetch(
    new Request(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
      {
        headers: {
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          Upgrade: "websocket",
        },
      },
    ),
  );
  const socket = (
    response as Response & { readonly webSocket?: WorkerWebSocket | null }
  ).webSocket;
  if (!socket || response.status !== 101) {
    const diagnostic = await response.text().catch(() => "");
    console.warn(
      "OpenAI Realtime voice handshake failed",
      response.status,
      diagnostic.slice(0, 240),
    );
    throw new WorkerError(502, `OpenAI Realtime 음성 연결 실패 (${response.status})`);
  }
  socket.accept();
  const startedAt = performance.now();
  const requestConfig = realtimeVoiceRequestConfig(input);

  return new Promise<RealtimeVoiceResponse>((resolve, reject) => {
    let firstDeltaMs: number | undefined;
    let settled = false;
    const timer = setTimeout(
      () => fail(new WorkerError(504, "OpenAI Realtime 음성 응답 시간이 초과되었습니다.")),
      REALTIME_TIMEOUT_MS,
    );
    const cleanup = (): void => {
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      socket.removeEventListener("error", onError);
      socket.removeEventListener("close", onClose);
    };
    const fail = (error: Error): void => {
      if (settled) return;
      settled = true;
      cleanup();
      try {
        socket.close(1011, "voice judgement failed");
      } catch {
        // 연결이 이미 닫힌 경우 무시한다.
      }
      reject(error);
    };
    const complete = (argumentsJson: string): void => {
      if (settled) return;
      let argumentsValue: unknown;
      try {
        argumentsValue = JSON.parse(argumentsJson);
      } catch {
        fail(new WorkerError(502, "OpenAI Realtime 음성 판정 형식이 올바르지 않습니다."));
        return;
      }
      let result: RealtimeVoiceResponse;
      try {
        result = parseRealtimeVoiceResult(
          input,
          model,
          argumentsValue,
          {
            upstreamMs: elapsedMs(startedAt),
            ...(firstDeltaMs === undefined ? {} : { firstDeltaMs }),
          },
        );
      } catch (error) {
        if (error instanceof z.ZodError) {
          console.warn(
            "OpenAI Realtime voice schema rejection",
            error.issues
              .map((issue) => `${issue.path.join(".")}:${issue.code}`)
              .join(","),
          );
        }
        fail(
          error instanceof WorkerError
            ? error
            : new WorkerError(502, "OpenAI Realtime 음성 판정 형식이 올바르지 않습니다."),
        );
        return;
      }
      settled = true;
      cleanup();
      try {
        socket.close(1000, "voice judgement complete");
      } catch {
        // 연결이 이미 닫힌 경우 무시한다.
      }
      resolve(result);
    };
    const onMessage = (event: MessageEvent): void => {
      if (typeof event.data !== "string") return;
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        fail(new WorkerError(502, "OpenAI Realtime 음성 응답 형식이 올바르지 않습니다."));
        return;
      }
      if (!payload || typeof payload !== "object") return;
      const realtimeEvent = payload as {
        type?: string;
        response?: {
          status?: string;
          output?: Array<{
            type?: string;
            name?: string;
            arguments?: string;
          }>;
        };
        error?: { type?: string; code?: string; message?: string };
      };
      if (realtimeEvent.type === "response.function_call_arguments.delta") {
        if (firstDeltaMs === undefined) firstDeltaMs = elapsedMs(startedAt);
        return;
      }
      if (realtimeEvent.type === "response.done") {
        if (realtimeEvent.response?.status !== "completed") {
          fail(new WorkerError(502, "OpenAI Realtime 음성 판정이 완료되지 않았습니다."));
          return;
        }
        const call = realtimeEvent.response.output?.find(
          (item) =>
            item.type === "function_call" && item.name === requestConfig.tool.name,
        );
        if (!call?.arguments) {
          fail(new WorkerError(502, "OpenAI Realtime 음성 판정 본문이 없습니다."));
          return;
        }
        complete(call.arguments);
        return;
      }
      if (realtimeEvent.type === "error") {
        console.warn(
          "OpenAI Realtime voice event error",
          realtimeEvent.error?.type ?? "unknown_type",
          realtimeEvent.error?.code ?? "unknown_code",
          (realtimeEvent.error?.message ?? "unknown_message").slice(0, 240),
        );
        fail(new WorkerError(502, "OpenAI Realtime 음성 호출에 실패했습니다."));
      }
    };
    const onError = (): void =>
      fail(new WorkerError(502, "OpenAI Realtime 음성 연결 오류가 발생했습니다."));
    const onClose = (): void =>
      fail(new WorkerError(502, "OpenAI Realtime 음성 연결이 일찍 종료되었습니다."));

    socket.addEventListener("message", onMessage);
    socket.addEventListener("error", onError);
    socket.addEventListener("close", onClose);

    try {
      socket.send(
        JSON.stringify({
          type: "session.update",
          session: {
            type: "realtime",
            model,
            output_modalities: ["text"],
            instructions: requestConfig.instructions,
            reasoning: { effort: "low" },
            max_output_tokens: 256,
            audio: {
              input: {
                format: { type: "audio/pcm", rate: REALTIME_PCM_SAMPLE_RATE },
                turn_detection: null,
              },
            },
            tools: [requestConfig.tool],
            tool_choice: "required",
          },
        }),
      );
      for (let offset = 0; offset < pcm.length; offset += REALTIME_PCM_CHUNK_BYTES) {
        socket.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: bytesToBase64(pcm.subarray(offset, offset + REALTIME_PCM_CHUNK_BYTES)),
          }),
        );
      }
      socket.send(JSON.stringify({ type: "input_audio_buffer.commit" }));
      socket.send(JSON.stringify({ type: "response.create" }));
    } catch {
      fail(new WorkerError(502, "OpenAI Realtime 음성 전송에 실패했습니다."));
    }
  });
}

interface RealtimeVoiceTool {
  readonly type: "function";
  readonly name: string;
  readonly description: string;
  readonly parameters: Record<string, unknown>;
}

function realtimeVoiceRequestConfig(input: RealtimeVoiceRequest): {
  readonly instructions: string;
  readonly tool: RealtimeVoiceTool;
} {
  const transcriptProperty = {
    type: "string",
    minLength: 1,
    maxLength: 1_000,
    description: "사용자의 한국어 발화를 들린 그대로 전사한 문장",
  };
  if (input.mode === "transcript") {
    return {
      instructions: [
        "사용자의 한국어 음성을 정확히 듣고 제공된 함수만 호출한다.",
        "고유명사: 주노, 심사역, 마법소녀, 언령, 투자심사.",
        "추측해 내용을 추가하지 말고 들린 발화를 transcript에 기록한다.",
      ].join("\n"),
      tool: {
        type: "function",
        name: "submit_transcript",
        description: "정확히 들은 사용자 발화를 제출한다.",
        parameters: {
          type: "object",
          properties: { transcript: transcriptProperty },
          required: ["transcript"],
          additionalProperties: false,
        },
      },
    };
  }
  if (input.mode === "dialogue") {
    const judgementSchema = dialogueJudgementJsonSchema(input.context);
    return {
      instructions: [
        "사용자의 한국어 음성을 직접 듣고 정확한 전사와 대화 판정을 한 번에 수행한다.",
        dialogueSystemInstruction(input.context),
        `현재 목표와 문맥: ${JSON.stringify({
          objective: input.context.objective,
          context: input.context.llmContext,
          recentTurns: input.context.recentTurns,
          intents: input.context.intents,
          allowedFlags: input.context.allowedFlags,
          sampleLines: input.context.persona.sampleLines,
        })}`,
      ].join("\n"),
      tool: {
        type: "function",
        name: "submit_dialogue_judgement",
        description: "사용자 발화 전사와 검증 가능한 대화 판정을 제출한다.",
        parameters: {
          ...judgementSchema,
          properties: {
            transcript: transcriptProperty,
            ...(judgementSchema.properties as Record<string, unknown>),
          },
          required: [
            "transcript",
            ...((judgementSchema.required as string[] | undefined) ?? []),
          ],
        },
      },
    };
  }
  const judgementSchema = battleJudgementJsonSchema();
  return {
    instructions: [
      "사용자의 한국어 음성을 직접 듣고 정확한 전사와 언령 배틀 판정을 한 번에 수행한다.",
      battleSystemInstruction(),
      `현재 적과 문맥: ${JSON.stringify(input.context)}`,
    ].join("\n"),
    tool: {
      type: "function",
      name: "submit_battle_judgement",
      description: "사용자 발화 전사와 검증 가능한 전투 판정을 제출한다.",
      parameters: {
        ...judgementSchema,
        properties: {
          transcript: transcriptProperty,
          ...(judgementSchema.properties as Record<string, unknown>),
        },
        required: [
          "transcript",
          ...((judgementSchema.required as string[] | undefined) ?? []),
        ],
      },
    },
  };
}

function parseRealtimeVoiceResult(
  input: RealtimeVoiceRequest,
  model: string,
  value: unknown,
  metrics: TranscriptionMetrics,
): RealtimeVoiceResponse {
  const envelope = z
    .object({ transcript: z.string().trim().min(1).max(1_000) })
    .passthrough()
    .parse(value);
  if (input.mode === "transcript") {
    return { mode: "transcript", model, text: envelope.transcript, metrics };
  }
  const { transcript, ...judgementValue } = envelope;
  if (input.mode === "dialogue") {
    const judgement = validateDialogueJudgement(
      input.context,
      judgementValue,
      transcript,
    );
    return {
      mode: "dialogue",
      model,
      text: transcript,
      judgement,
      metrics,
    };
  }
  const judgement = BattleJudgementSchema.parse(judgementValue);
  try {
    assertReplyPolicy(judgement.reply, transcript);
    if (judgement.narration) assertReplyPolicy(judgement.narration, transcript);
  } catch {
    throw new WorkerError(502, "전투 응답이 안전 규칙을 위반했습니다.");
  }
  return { mode: "battle", model, text: transcript, judgement, metrics };
}

function resolveOpenAiSttModel(
  requestedModel: string | undefined,
  env: Env,
): OpenAiSttModel {
  if (!requestedModel) return DEFAULT_OPENAI_MODEL;
  const parsed = OpenAiSttModelSchema.safeParse(requestedModel);
  if (!parsed.success) throw new WorkerError(400, "지원하지 않는 STT 모델입니다.");
  if (
    parsed.data !== DEFAULT_OPENAI_MODEL &&
    env.ENABLE_OPENAI_STT_MODEL_SELECTOR !== "true"
  ) {
    throw new WorkerError(400, "테스트 STT 모델 선택이 비활성화되어 있습니다.");
  }
  return parsed.data;
}

async function extractPcm16MonoWav(
  audio: File,
  expectedSampleRate: number,
): Promise<Uint8Array> {
  const buffer = await audio.arrayBuffer();
  const view = new DataView(buffer);
  if (
    buffer.byteLength < 44 ||
    readAscii(view, 0, 4) !== "RIFF" ||
    readAscii(view, 8, 4) !== "WAVE"
  ) {
    throw new WorkerError(400, "WAV 헤더가 올바르지 않습니다.");
  }

  let format: { channels: number; sampleRate: number; bitsPerSample: number } | undefined;
  let pcm: Uint8Array | undefined;
  for (let offset = 12; offset + 8 <= buffer.byteLength; ) {
    const chunkId = readAscii(view, offset, 4);
    const chunkSize = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkSize;
    if (chunkEnd > buffer.byteLength) {
      throw new WorkerError(400, "WAV 청크 길이가 올바르지 않습니다.");
    }
    if (chunkId === "fmt ") {
      if (chunkSize < 16 || view.getUint16(chunkStart, true) !== 1) {
        throw new WorkerError(415, "PCM WAV 형식만 지원합니다.");
      }
      format = {
        channels: view.getUint16(chunkStart + 2, true),
        sampleRate: view.getUint32(chunkStart + 4, true),
        bitsPerSample: view.getUint16(chunkStart + 14, true),
      };
    } else if (chunkId === "data") {
      pcm = new Uint8Array(buffer.slice(chunkStart, chunkEnd));
    }
    offset = chunkEnd + (chunkSize % 2);
  }

  if (!format || !pcm?.length) throw new WorkerError(400, "WAV PCM 데이터가 없습니다.");
  if (
    format.channels !== 1 ||
    format.bitsPerSample !== 16 ||
    format.sampleRate !== expectedSampleRate
  ) {
    throw new WorkerError(
      415,
      `${expectedSampleRate}Hz 16-bit mono PCM WAV 형식이 필요합니다.`,
    );
  }
  return pcm;
}

function readAscii(view: DataView, offset: number, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(view.getUint8(offset + index));
  }
  return value;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 32_768));
  }
  return btoa(binary);
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
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

function dialogueSystemInstruction(
  input: z.infer<typeof DialogueVoiceContextSchema>,
): string {
  return [
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
}

function dialogueJudgementJsonSchema(
  input: z.infer<typeof DialogueVoiceContextSchema>,
): Record<string, unknown> {
  const intentIds = input.intents.map(({ id }) => id);
  return {
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
}

function validateDialogueJudgement(
  input: z.infer<typeof DialogueVoiceContextSchema>,
  value: unknown,
  transcript: string,
): z.infer<typeof DialogueJudgementSchema> {
  const intentIds = input.intents.map(({ id }) => id);
  const parsed = DialogueJudgementSchema.parse(value);
  if (!intentIds.includes(parsed.intentId)) {
    throw new WorkerError(502, "허용되지 않은 intent입니다.");
  }
  if (parsed.flags.some((flag) => !input.allowedFlags.includes(flag))) {
    throw new WorkerError(502, "허용되지 않은 flag입니다.");
  }
  try {
    assertReplyPolicy(parsed.reply, transcript);
  } catch {
    throw new WorkerError(502, "주노 응답이 안전 규칙을 위반했습니다.");
  }
  return parsed;
}

function battleSystemInstruction(): string {
  return [
    "너는 언령 배틀의 적과 나레이션을 판정한다.",
    "플레이어 발화가 현재 적의 약점을 얼마나 정확히 찌르는지 평가하라.",
    "momentumDelta는 반드시 -5에서 +10 사이 정수다.",
    "reply와 narration은 각각 80자 이내로 작성하라.",
    "플레이어가 말하지 않은 감정을 단정하지 마라.",
    "검은 마법소녀의 존재·이름·정체를 공개하거나 암시하지 마라.",
  ].join("\n");
}

function battleJudgementJsonSchema(): Record<string, unknown> {
  return {
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
  };
}

async function judgeDialogue(
  input: z.infer<typeof DialogueRequestSchema>,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<z.infer<typeof DialogueJudgementSchema>> {
  const response = await callStructuredLlm(
    {
      label: "대화 LLM",
      systemInstruction: dialogueSystemInstruction(input),
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
      responseJsonSchema: dialogueJudgementJsonSchema(input),
      maxOutputTokens: 256,
    },
    env,
    upstreamFetch,
  );
  return validateDialogueJudgement(input, response, input.transcript);
}

async function judgeBattle(
  input: z.infer<typeof BattleRequestSchema>,
  env: Env,
  upstreamFetch: UpstreamFetch,
): Promise<z.infer<typeof BattleJudgementSchema>> {
  const response = await callStructuredLlm(
    {
      label: "전투 LLM",
      systemInstruction: battleSystemInstruction(),
      input: JSON.stringify({
        enemyPrompt: input.enemyPrompt,
        context: input.llmContext,
        player: input.transcript,
      }),
      schemaName: "battle_judgement",
      responseJsonSchema: battleJudgementJsonSchema(),
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
