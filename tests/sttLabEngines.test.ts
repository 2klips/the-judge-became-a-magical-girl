import { describe, expect, it } from "vitest";
import {
  createLocalWhisperEngine,
  createWorkerEngine,
} from "../src/stt-lab/engines";
import type { LabAudio } from "../src/stt-lab/comparison";

describe("STT Lab remote engine", () => {
  it("정규화된 WAV를 Worker에 보내고 검증된 전사 결과만 반환한다", async () => {
    const audio: LabAudio = {
      wavBlob: new Blob(["normalized-wav"], { type: "audio/wav" }),
      samples: new Float32Array([0, 0.1]),
      durationMs: 10,
    };
    let received: Request | undefined;
    const engine = createWorkerEngine({
      id: "A",
      label: "OpenAI",
      path: "/transcribe/openai",
      workerUrl: "http://127.0.0.1:8787",
      fetcher: async (request) => {
        received = request;
        return Response.json({ model: "gpt-transcribe", text: "  정확한 발화  " });
      },
    });

    await expect(engine.transcribe(audio)).resolves.toEqual({
      model: "gpt-transcribe",
      text: "정확한 발화",
    });
    expect(received?.url).toBe("http://127.0.0.1:8787/transcribe/openai");
    const form = await received?.formData();
    const file = form?.get("audio");
    expect(file).toBeInstanceOf(File);
    expect((file as File).type).toBe("audio/wav");
  });

  it("Worker 오류 메시지를 카드에 표시할 오류로 전달한다", async () => {
    const engine = createWorkerEngine({
      id: "B",
      label: "Gemini",
      path: "/transcribe/gemini",
      workerUrl: "http://127.0.0.1:8787",
      fetcher: async () => Response.json({ error: "Gemini API 키가 설정되지 않았습니다." }, { status: 503 }),
    });

    await expect(
      engine.transcribe({
        wavBlob: new Blob(["wav"], { type: "audio/wav" }),
        samples: new Float32Array([0]),
        durationMs: 1,
      }),
    ).rejects.toThrow("Gemini API 키가 설정되지 않았습니다.");
  });
});

describe("STT Lab local Whisper engine", () => {
  it("같은 16 kHz samples를 로컬 모델에 전달하고 로드/추론 시간을 분리한다", async () => {
    const samples = new Float32Array([0, 0.25, -0.25]);
    const ticks = [0, 100, 350];
    const progress: string[] = [];
    const engine = createLocalWhisperEngine({
      model: "onnx-community/whisper-small",
      now: () => ticks.shift() ?? 350,
      onProgress: (message) => progress.push(message),
      loadPipeline: async (report) => {
        report("모델 파일 50%");
        return async (input, options) => {
          expect(input).toBe(samples);
          expect(options).toEqual({ language: "ko", task: "transcribe" });
          return { text: "  로컬 전사 결과  " };
        };
      },
    });

    await expect(
      engine.transcribe({
        wavBlob: new Blob(["wav"], { type: "audio/wav" }),
        samples,
        durationMs: 10,
      }),
    ).resolves.toEqual({
      model: "onnx-community/whisper-small",
      text: "로컬 전사 결과",
      metrics: { modelLoadMs: 100, inferenceMs: 250 },
    });
    expect(progress).toContain("모델 파일 50%");
  });
});
