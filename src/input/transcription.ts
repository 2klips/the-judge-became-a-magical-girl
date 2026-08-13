import { z } from "zod";
import { readWorkerJson } from "../network/workerResponse";
import {
  BattleJudgementSchema,
  DialogueJudgementSchema,
  type BattleJudgementResult,
  type DialogueJudgementResult,
} from "../judge/schema";
import type { AudioLevelMetrics } from "./audioLevel";
import type { PttRecordingPort } from "./recording";

export type SttProviderId = "openai" | "gemini";
export const OpenAiSttModelSchema = z.enum([
  "gpt-realtime-2.1-mini",
  "gpt-transcribe",
  "gpt-live-transcribe",
]);
export type OpenAiSttModel = z.infer<typeof OpenAiSttModelSchema>;

export type VoiceAnalysis =
  | { readonly kind: "transcript" }
  | {
      readonly kind: "dialogue";
      readonly judgement: DialogueJudgementResult;
    }
  | {
      readonly kind: "battle";
      readonly judgement: BattleJudgementResult;
    };

export interface TranscriptionObservation {
  readonly text: string;
  readonly model: string;
  readonly roundTripMs: number;
  readonly upstreamMs?: number;
  readonly firstDeltaMs?: number;
  readonly analysis?: VoiceAnalysis;
}

export interface TranscriptionPort {
  readonly provider: SttProviderId;
  transcribe(audio: Blob, signal: AbortSignal): Promise<TranscriptionObservation>;
}

export type VoiceFailureKind =
  | "recording"
  | "permission"
  | "network"
  | "timeout"
  | "http"
  | "schema"
  | "no-speech";

export interface VoiceInputFailure {
  readonly kind: VoiceFailureKind;
  readonly debugMessage: string;
}

export type RecordedVoiceResult =
  | {
      kind: "transcript";
      transcript: string;
      audioLevel: AudioLevelMetrics;
      observation: TranscriptionObservation;
    }
  | { kind: "cancelled" }
  | { kind: "error"; failure: VoiceInputFailure };

interface WorkerTranscriptionOptions {
  provider: SttProviderId;
  model?: OpenAiSttModel;
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
  timeoutMs?: number;
}

export type RealtimeVoiceRequest =
  | { readonly mode: "transcript" }
  | {
      readonly mode: "dialogue";
      readonly context: {
        readonly objective: string;
        readonly llmContext: string;
        readonly persona: {
          readonly id: string;
          readonly name: string;
          readonly role: string;
          readonly traits: readonly string[];
          readonly speechRules: readonly string[];
          readonly taboos: readonly string[];
          readonly sampleLines: readonly string[];
        };
        readonly intents: readonly {
          readonly id: string;
          readonly examples: readonly string[];
          readonly keywords: readonly string[];
        }[];
        readonly allowedFlags: readonly string[];
        readonly recentTurns: readonly {
          readonly role: "player" | "juno";
          readonly text: string;
        }[];
      };
    }
  | {
      readonly mode: "battle";
      readonly context: {
        readonly enemyPrompt: string;
        readonly llmContext: string;
      };
    };

interface WorkerRealtimeVoiceOptions {
  request: RealtimeVoiceRequest;
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
  timeoutMs?: number;
}

const WorkerTranscriptSchema = z
  .object({
    model: z.string().min(1),
    text: z.string(),
    metrics: z
      .object({
        upstreamMs: z.number().nonnegative(),
        firstDeltaMs: z.number().nonnegative().optional(),
      })
      .strict()
      .optional(),
  })
  .strict();
const WorkerErrorSchema = z.object({ error: z.string().min(1) });
const RealtimeVoiceMetricsSchema = z
  .object({
    upstreamMs: z.number().nonnegative(),
    firstDeltaMs: z.number().nonnegative().optional(),
  })
  .strict();
const RealtimeVoiceResponseSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("transcript"),
      model: z.literal("gpt-realtime-2.1-mini"),
      text: z.string().trim().min(1),
      metrics: RealtimeVoiceMetricsSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal("dialogue"),
      model: z.literal("gpt-realtime-2.1-mini"),
      text: z.string().trim().min(1),
      judgement: DialogueJudgementSchema,
      metrics: RealtimeVoiceMetricsSchema,
    })
    .strict(),
  z
    .object({
      mode: z.literal("battle"),
      model: z.literal("gpt-realtime-2.1-mini"),
      text: z.string().trim().min(1),
      judgement: BattleJudgementSchema,
      metrics: RealtimeVoiceMetricsSchema,
    })
    .strict(),
]);

export class RecordedVoiceTurnController {
  private requestId = 0;
  private abortController: AbortController | undefined;
  private active = false;

  constructor(
    private readonly recording: PttRecordingPort,
    private readonly transcription: TranscriptionPort,
  ) {}

  async press(): Promise<void> {
    if (this.active) this.cancel();
    const requestId = ++this.requestId;
    this.active = true;
    await this.recording.start();
    if (requestId !== this.requestId) this.recording.cancel();
  }

  async release(): Promise<RecordedVoiceResult> {
    const requestId = this.requestId;
    const controller = new AbortController();
    this.abortController = controller;
    try {
      const audio = await this.recording.stop();
      if (requestId !== this.requestId) return { kind: "cancelled" };
      const observation = await this.transcription.transcribe(audio.wavBlob, controller.signal);
      const transcript = observation.text.trim();
      if (requestId !== this.requestId) return { kind: "cancelled" };
      if (!transcript) {
        return {
          kind: "error",
          failure: classifyVoiceInputError(new Error("전사문이 비어 있습니다.")),
        };
      }
      return {
        kind: "transcript",
        transcript,
        audioLevel: audio.level,
        observation: { ...observation, text: transcript },
      };
    } catch (error) {
      if (requestId !== this.requestId || controller.signal.aborted) return { kind: "cancelled" };
      return { kind: "error", failure: classifyVoiceInputError(error) };
    } finally {
      if (this.abortController === controller) this.abortController = undefined;
      if (requestId === this.requestId) this.active = false;
    }
  }

  cancel(): void {
    this.requestId += 1;
    this.abortController?.abort();
    this.abortController = undefined;
    if (this.active) this.recording.cancel();
    this.active = false;
  }
}

export function createWorkerTranscriptionPort(
  options: WorkerTranscriptionOptions,
): TranscriptionPort {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 12_000;
  return {
    provider: options.provider,
    async transcribe(audio, signal) {
      const startedAt = performance.now();
      const form = new FormData();
      form.append("audio", audio, "speech.wav");
      if (options.provider === "openai" && options.model) {
        form.append("model", options.model);
      }
      const path = `/transcribe/${options.provider}`;
      const response = await fetchWithTimeout(
        fetcher,
        new Request(new URL(path, ensureTrailingSlash(options.workerUrl)), {
          method: "POST",
          body: form,
        }),
        signal,
        timeoutMs,
      );
      const body = await readWorkerJson(response, "STT Worker");
      if (!response.ok) {
        const parsed = WorkerErrorSchema.safeParse(body);
        const detail = parsed.success ? `: ${parsed.data.error}` : "";
        throw new Error(`STT 요청 실패 (${response.status})${detail}`);
      }
      const transcript = WorkerTranscriptSchema.parse(body);
      return {
        text: transcript.text.trim(),
        model: transcript.model,
        roundTripMs: Math.max(0, Math.round(performance.now() - startedAt)),
        upstreamMs: transcript.metrics?.upstreamMs,
        firstDeltaMs: transcript.metrics?.firstDeltaMs,
      };
    },
  };
}

export function createWorkerRealtimeVoicePort(
  options: WorkerRealtimeVoiceOptions,
): TranscriptionPort {
  const fetcher = options.fetcher ?? fetch;
  const timeoutMs = options.timeoutMs ?? 12_000;
  return {
    provider: "openai",
    async transcribe(audio, signal) {
      const startedAt = performance.now();
      const form = new FormData();
      form.append("audio", audio, "speech.wav");
      form.append("mode", options.request.mode);
      if ("context" in options.request) {
        form.append("context", JSON.stringify(options.request.context));
      }
      const response = await fetchWithTimeout(
        fetcher,
        new Request(new URL("/voice/realtime", ensureTrailingSlash(options.workerUrl)), {
          method: "POST",
          body: form,
        }),
        signal,
        timeoutMs,
      );
      const body = await readWorkerJson(response, "Realtime Voice Worker");
      if (!response.ok) {
        const parsed = WorkerErrorSchema.safeParse(body);
        const detail = parsed.success ? `: ${parsed.data.error}` : "";
        throw new Error(`Realtime 음성 요청 실패 (${response.status})${detail}`);
      }
      const result = RealtimeVoiceResponseSchema.parse(body);
      const analysis: VoiceAnalysis =
        result.mode === "dialogue"
          ? { kind: "dialogue", judgement: result.judgement }
          : result.mode === "battle"
            ? { kind: "battle", judgement: result.judgement }
            : { kind: "transcript" };
      return {
        text: result.text,
        model: result.model,
        roundTripMs: Math.max(0, Math.round(performance.now() - startedAt)),
        upstreamMs: result.metrics.upstreamMs,
        firstDeltaMs: result.metrics.firstDeltaMs,
        analysis,
      };
    },
  };
}

export function resolveSttProvider(
  params: URLSearchParams,
  lockedProvider?: SttProviderId,
): SttProviderId {
  if (lockedProvider) return lockedProvider;
  return params.get("stt") === "gemini" ? "gemini" : "openai";
}

export function resolveOpenAiSttModel(
  params: URLSearchParams,
  debugEnabled: boolean,
): OpenAiSttModel {
  if (!debugEnabled) return "gpt-realtime-2.1-mini";
  const parsed = OpenAiSttModelSchema.safeParse(params.get("sttModel"));
  return parsed.success ? parsed.data : "gpt-realtime-2.1-mini";
}

export function sttSampleRate(model: OpenAiSttModel): 16_000 | 24_000 {
  return model === "gpt-transcribe" ? 16_000 : 24_000;
}

export function sttProviderLabel(provider: SttProviderId): string {
  return provider === "openai" ? "GPT" : "Gemini";
}

export function classifyVoiceInputError(error: unknown): VoiceInputFailure {
  const value = toError(error);
  const message = value.message.trim();
  if (value instanceof DOMException && value.name === "NotAllowedError") {
    return { kind: "permission", debugMessage: message };
  }
  if (/unable to decode audio data/i.test(message)) {
    return { kind: "recording", debugMessage: message };
  }
  if (/전사문이 비어|no speech/i.test(message)) {
    return { kind: "no-speech", debugMessage: message };
  }
  if (/timeout|시간 초과/i.test(message)) {
    return { kind: "timeout", debugMessage: message };
  }
  if (/failed to fetch|networkerror|network request failed/i.test(message)) {
    return { kind: "network", debugMessage: message };
  }
  if (/요청 실패 \([45][0-9]{2}\)/i.test(message)) {
    return { kind: "http", debugMessage: message };
  }
  if (/응답이 JSON이 아닙니다|zod|invalid.*response|schema/i.test(message)) {
    return { kind: "schema", debugMessage: message };
  }
  return { kind: "recording", debugMessage: message };
}

export function formatVoiceInputError(failure: VoiceInputFailure): string {
  switch (failure.kind) {
    case "permission":
      return "마이크 권한을 사용할 수 없어.";
    case "network":
    case "http":
      return "음성 서버에 연결하지 못했어.";
    case "timeout":
      return "음성 처리가 예상보다 오래 걸렸어.";
    case "schema":
      return "음성 서버 응답 형식을 확인하지 못했어.";
    case "no-speech":
      return "녹음에서 목소리를 찾지 못했어.";
    case "recording":
      return "마이크 녹음을 처리하지 못했어.";
  }
}

async function fetchWithTimeout(
  fetcher: (request: Request) => Promise<Response>,
  request: Request,
  parentSignal: AbortSignal,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const abort = (): void => controller.abort(parentSignal.reason);
  if (parentSignal.aborted) abort();
  else parentSignal.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => controller.abort(new Error("STT timeout")), timeoutMs);
  try {
    return await fetcher(new Request(request, { signal: controller.signal }));
  } finally {
    clearTimeout(timer);
    parentSignal.removeEventListener("abort", abort);
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}
