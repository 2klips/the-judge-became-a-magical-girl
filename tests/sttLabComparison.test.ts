import { describe, expect, it } from "vitest";
import {
  runComparison,
  type LabAudio,
  type TranscriptionEngine,
} from "../src/stt-lab/comparison";

describe("STT Lab provider comparison", () => {
  it("같은 녹음을 모든 엔진에 전달하고 한 엔진 실패도 다른 결과를 보존한다", async () => {
    const audio: LabAudio = {
      wavBlob: new Blob(["same-audio"], { type: "audio/wav" }),
      samples: new Float32Array([0, 0.5, -0.5]),
      durationMs: 1200,
    };
    const received: LabAudio[] = [];
    const engines: TranscriptionEngine[] = [
      successfulEngine("A", "OpenAI", "openai-model", "첫 번째 결과", received),
      successfulEngine("B", "Gemini", "gemini-model", "두 번째 결과", received),
      {
        id: "C",
        label: "Local Whisper",
        async transcribe(input) {
          received.push(input);
          throw new Error("모델 로드 실패");
        },
      },
    ];

    const reported: string[] = [];
    const results = await runComparison(audio, engines, {
      onResult: (result) => reported.push(`${result.id}:${result.status}`),
    });

    expect(received).toEqual([audio, audio, audio]);
    expect(reported).toEqual(["A:success", "B:success", "C:error"]);
    expect(results).toMatchObject([
      {
        id: "A",
        label: "OpenAI",
        status: "success",
        model: "openai-model",
        text: "첫 번째 결과",
      },
      {
        id: "B",
        label: "Gemini",
        status: "success",
        model: "gemini-model",
        text: "두 번째 결과",
      },
      {
        id: "C",
        label: "Local Whisper",
        status: "error",
        error: "모델 로드 실패",
      },
    ]);
  });
});

function successfulEngine(
  id: "A" | "B" | "C",
  label: string,
  model: string,
  text: string,
  received: LabAudio[],
): TranscriptionEngine {
  return {
    id,
    label,
    async transcribe(audio) {
      received.push(audio);
      return { model, text };
    },
  };
}
