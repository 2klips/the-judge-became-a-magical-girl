import { z } from "zod";
import { readWorkerJson } from "../network/workerResponse";
import type { AudioLevelMetrics } from "./audioLevel";
import type { PttRecordingPort } from "./recording";

export type SttProviderId = "openai" | "gemini";

export interface TranscriptionPort {
  readonly provider: SttProviderId;
  transcribe(audio: Blob, signal: AbortSignal): Promise<string>;
}

export type RecordedVoiceResult =
  | { kind: "transcript"; transcript: string; audioLevel: AudioLevelMetrics }
  | { kind: "cancelled" }
  | { kind: "error"; error: Error };

interface WorkerTranscriptionOptions {
  provider: SttProviderId;
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
  timeoutMs?: number;
}

const WorkerTranscriptSchema = z
  .object({
    model: z.string().min(1),
    text: z.string(),
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
      const transcript = (
        await this.transcription.transcribe(audio.wavBlob, controller.signal)
      ).trim();
      if (requestId !== this.requestId) return { kind: "cancelled" };
      if (!transcript) return { kind: "error", error: new Error("전사문이 비어 있습니다.") };
      return { kind: "transcript", transcript, audioLevel: audio.level };
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
      const form = new FormData();
      form.append("audio", audio, "speech.wav");
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
      return WorkerTranscriptSchema.parse(body).text.trim();
    },
  };
}

export function resolveSttProvider(params: URLSearchParams): SttProviderId {
  return params.get("stt") === "gemini" ? "gemini" : "openai";
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
