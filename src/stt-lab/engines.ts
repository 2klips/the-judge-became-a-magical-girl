import { z } from "zod";
import type { TranscriptionEngine } from "./comparison";

const WorkerTranscriptSchema = z.object({
  model: z.string().min(1),
  text: z.string(),
});

const WorkerErrorSchema = z.object({
  error: z.string().min(1),
});

const LocalTranscriptSchema = z.object({
  text: z.string(),
});

export interface WorkerEngineOptions {
  id: "A" | "B";
  label: string;
  path: `/transcribe/${string}`;
  workerUrl: string;
  fetcher?: (request: Request) => Promise<Response>;
}

export function createWorkerEngine(options: WorkerEngineOptions): TranscriptionEngine {
  const fetcher = options.fetcher ?? fetch;
  return {
    id: options.id,
    label: options.label,
    async transcribe(audio) {
      const form = new FormData();
      form.append("audio", audio.wavBlob, "speech.wav");
      const response = await fetcher(
        new Request(new URL(options.path, ensureTrailingSlash(options.workerUrl)), {
          method: "POST",
          body: form,
        }),
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const parsedError = WorkerErrorSchema.safeParse(body);
        throw new Error(
          parsedError.success ? parsedError.data.error : `${options.label} STT 요청에 실패했습니다.`,
        );
      }

      const result = WorkerTranscriptSchema.parse(body);
      return { model: result.model, text: result.text.trim() };
    },
  };
}

interface LocalWhisperOptions {
  language: "ko";
  task: "transcribe";
}

type LocalWhisperPipeline = (
  samples: Float32Array,
  options: LocalWhisperOptions,
) => Promise<unknown>;

type LocalWhisperLoader = (
  report: (message: string) => void,
) => Promise<LocalWhisperPipeline>;

export interface LocalWhisperEngineOptions {
  model?: string;
  onProgress?: (message: string) => void;
  loadPipeline?: LocalWhisperLoader;
  now?: () => number;
}

export function createLocalWhisperEngine(
  options: LocalWhisperEngineOptions = {},
): TranscriptionEngine {
  const model = options.model ?? "onnx-community/whisper-small";
  const report = options.onProgress ?? (() => undefined);
  const now = options.now ?? (() => performance.now());
  const loader = options.loadPipeline ?? createBrowserWhisperLoader(model);
  let pipelinePromise: Promise<LocalWhisperPipeline> | undefined;

  return {
    id: "C",
    label: "로컬 Whisper",
    async transcribe(audio) {
      const loadStartedAt = now();
      pipelinePromise ??= loader(report);
      const localPipeline = await pipelinePromise;
      const inferenceStartedAt = now();
      report("로컬 추론 중");
      const output = LocalTranscriptSchema.parse(
        await localPipeline(audio.samples, { language: "ko", task: "transcribe" }),
      );
      const completedAt = now();
      report("로컬 전사 완료");

      return {
        model,
        text: output.text.trim(),
        metrics: {
          modelLoadMs: Math.max(0, inferenceStartedAt - loadStartedAt),
          inferenceMs: Math.max(0, completedAt - inferenceStartedAt),
        },
      };
    },
  };
}

function createBrowserWhisperLoader(model: string): LocalWhisperLoader {
  return async (report) => {
    const { pipeline } = await import("@huggingface/transformers");
    const hasWebGpu = Boolean((navigator as Navigator & { gpu?: unknown }).gpu);
    report(hasWebGpu ? "WebGPU 모델 로드 시작" : "WASM 모델 로드 시작");
    const transcriber = await pipeline("automatic-speech-recognition", model, {
      device: hasWebGpu ? "webgpu" : "wasm",
      dtype: "q4",
      progress_callback: (progress) => report(formatModelProgress(progress)),
    });

    return async (samples, transcriptionOptions) =>
      transcriber(samples, {
        language: transcriptionOptions.language,
        task: transcriptionOptions.task,
      });
  };
}

function formatModelProgress(progress: unknown): string {
  if (!progress || typeof progress !== "object") {
    return "모델 준비 중";
  }
  const info = progress as { status?: unknown; progress?: unknown; file?: unknown };
  const status = typeof info.status === "string" ? info.status : "loading";
  const file = typeof info.file === "string" ? ` · ${info.file}` : "";
  const percent =
    typeof info.progress === "number" && Number.isFinite(info.progress)
      ? ` ${Math.round(info.progress)}%`
      : "";
  return `${status}${percent}${file}`;
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}
