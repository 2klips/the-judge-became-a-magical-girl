import { z } from "zod";
import { readWorkerJson } from "../network/workerResponse";
import type { AudioLevelMetrics } from "./audioLevel";
import type { PttRecordingPort } from "./recording";

export type SttProviderId = "openai" | "gemini";
export const OpenAiSttModelSchema = z.enum([
  "gpt-transcribe",
  "gpt-live-transcribe",
]);
export type OpenAiSttModel = z.infer<typeof OpenAiSttModelSchema>;

export interface TranscriptionObservation {
  readonly text: string;
  readonly model: string;
  readonly roundTripMs: number;
  readonly upstreamMs?: number;
  readonly firstDeltaMs?: number;
}

export interface TranscriptionPort {
  readonly provider: SttProviderId;
  transcribe(audio: Blob, signal: AbortSignal): Promise<TranscriptionObservation>;
}

export type RecordedVoiceResult =
  | {
      kind: "transcript";
      transcript: string;
      audioLevel: AudioLevelMetrics;
      observation: TranscriptionObservation;
    }
  | { kind: "cancelled" }
  | { kind: "error"; error: Error };

interface WorkerTranscriptionOptions {
  provider: SttProviderId;
  model?: OpenAiSttModel;
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
      if (!transcript) return { kind: "error", error: new Error("전사문이 비어 있습니다.") };
      return {
        kind: "transcript",
        transcript,
        audioLevel: audio.level,
        observation: { ...observation, text: transcript },
      };
    } catch (error) {
      if (requestId !== this.requestId || controller.signal.aborted) return { kind: "cancelled" };
      return { kind: "error", error: toError(error) };
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
        throw new Error(parsed.success ? parsed.data.error : `STT 요청 실패 (${response.status})`);
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
  if (!debugEnabled) return "gpt-transcribe";
  const parsed = OpenAiSttModelSchema.safeParse(params.get("sttModel"));
  return parsed.success ? parsed.data : "gpt-transcribe";
}

export function sttSampleRate(model: OpenAiSttModel): 16_000 | 24_000 {
  return model === "gpt-live-transcribe" ? 24_000 : 16_000;
}

export function sttProviderLabel(provider: SttProviderId): string {
  return provider === "openai" ? "GPT" : "Gemini";
}

export function formatVoiceInputError(error: Error): string {
  if (/unable to decode audio data/i.test(error.message)) {
    return "녹음이 너무 짧아 음성을 처리하지 못했어. 버튼이나 T 키를 누른 채 말해 줘.";
  }
  return error.message.trim() || "음성을 처리하지 못했어. 한 번 더 시도해 줘.";
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
