import { z } from "zod";

const DEFAULT_OPENAI_MODEL = "gpt-transcribe";
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const MAX_AUDIO_BYTES = 19 * 1024 * 1024;

const OpenAiTranscriptSchema = z.object({
  text: z.string(),
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

const GeminiTranscriptSchema = z.object({
  text: z.string(),
});

export interface SttLabEnv {
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  OPENAI_TRANSCRIBE_MODEL?: string;
  GEMINI_MODEL?: string;
  ALLOWED_ORIGINS?: string;
}

type UpstreamFetch = (request: Request) => Promise<Response>;

export function createSttLabWorker(upstreamFetch: UpstreamFetch = fetch) {
  return {
    async fetch(request: Request, env: SttLabEnv): Promise<Response> {
      const origin = request.headers.get("origin") ?? "";
      if (!isAllowedOrigin(origin, env)) {
        return json({ error: "허용되지 않은 Origin입니다." }, 403);
      }

      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), origin);
      }

      const { pathname } = new URL(request.url);
      if (request.method === "GET" && pathname === "/health") {
        return withCors(
          json({
            openaiConfigured: Boolean(env.OPENAI_API_KEY),
            geminiConfigured: Boolean(env.GEMINI_API_KEY),
            openaiModel: env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_OPENAI_MODEL,
            geminiModel: env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
          }),
          origin,
        );
      }

      if (request.method !== "POST") {
        return withCors(json({ error: "지원하지 않는 요청입니다." }, 404), origin);
      }

      try {
        const audio = await readAudio(request);
        const result =
          pathname === "/transcribe/openai"
            ? await transcribeWithOpenAi(audio, env, upstreamFetch)
            : pathname === "/transcribe/gemini"
              ? await transcribeWithGemini(audio, env, upstreamFetch)
              : undefined;

        if (!result) {
          return withCors(json({ error: "지원하지 않는 경로입니다." }, 404), origin);
        }
        return withCors(json(result), origin);
      } catch (error) {
        const status = error instanceof WorkerError ? error.status : 500;
        const message = error instanceof Error ? error.message : "STT 처리에 실패했습니다.";
        return withCors(json({ error: message }, status), origin);
      }
    },
  };
}

async function readAudio(request: Request): Promise<File> {
  const form = await request.formData();
  const audio = form.get("audio");
  if (!(audio instanceof File) || audio.size === 0) {
    throw new WorkerError(400, "WAV 오디오 파일이 필요합니다.");
  }
  if (audio.type !== "audio/wav") {
    throw new WorkerError(415, "audio/wav 형식만 지원합니다.");
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    throw new WorkerError(413, "오디오 파일이 19MB 제한을 초과했습니다.");
  }
  return audio;
}

async function transcribeWithOpenAi(
  audio: File,
  env: SttLabEnv,
  upstreamFetch: UpstreamFetch,
): Promise<{ model: string; text: string }> {
  if (!env.OPENAI_API_KEY) {
    throw new WorkerError(503, "OpenAI API 키가 설정되지 않았습니다.");
  }
  const model = env.OPENAI_TRANSCRIBE_MODEL || DEFAULT_OPENAI_MODEL;
  const form = new FormData();
  form.append("file", audio, "speech.wav");
  form.append("model", model);
  form.append("language", "ko");
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
  if (!response.ok) {
    throw new WorkerError(502, `OpenAI STT 호출 실패 (${response.status})`);
  }
  const transcript = OpenAiTranscriptSchema.parse(await response.json());
  return { model, text: transcript.text.trim() };
}

async function transcribeWithGemini(
  audio: File,
  env: SttLabEnv,
  upstreamFetch: UpstreamFetch,
): Promise<{ model: string; text: string }> {
  if (!env.GEMINI_API_KEY) {
    throw new WorkerError(503, "Gemini API 키가 설정되지 않았습니다.");
  }
  const model = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const response = await upstreamFetch(
    new Request(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
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
            },
          },
        }),
      },
    ),
  );
  if (!response.ok) {
    throw new WorkerError(502, `Gemini STT 호출 실패 (${response.status})`);
  }

  const parsed = GeminiResponseSchema.parse(await response.json());
  const content = parsed.candidates[0]?.content.parts
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!content) {
    throw new WorkerError(502, "Gemini STT 응답에 전사문이 없습니다.");
  }
  const transcript = GeminiTranscriptSchema.parse(JSON.parse(content));
  return { model, text: transcript.text.trim() };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

function isAllowedOrigin(origin: string, env: SttLabEnv): boolean {
  const configured = env.ALLOWED_ORIGINS || "http://127.0.0.1:5173,http://localhost:5173";
  return configured
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
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export default createSttLabWorker();
