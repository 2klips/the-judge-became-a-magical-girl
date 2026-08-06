import { describe, expect, it, vi } from "vitest";
import type { PttRecordingPort } from "../src/input/recording";
import {
  RecordedVoiceTurnController,
  type TranscriptionPort,
} from "../src/input/transcription";

describe("M3 release 기반 녹음", () => {
  const level = { rmsDbfs: -24, peakDbfs: -8, clippingRatio: 0 };

  it("press 동안 유지하고 release에서만 녹음 종료와 STT를 시작한다", async () => {
    const wav = new Blob(["voice"], { type: "audio/wav" });
    const recording: PttRecordingPort = {
      start: vi.fn(async () => undefined),
      stop: vi.fn(async () => ({ wavBlob: wav, level })),
      cancel: vi.fn(),
    };
    const transcription: TranscriptionPort = {
      provider: "openai",
      transcribe: vi.fn(async () => ({
        text: "마법소녀가 직업이야?",
        model: "gpt-transcribe",
        roundTripMs: 320,
      })),
    };
    const controller = new RecordedVoiceTurnController(recording, transcription);

    await controller.press();

    expect(recording.start).toHaveBeenCalledTimes(1);
    expect(recording.stop).not.toHaveBeenCalled();
    expect(transcription.transcribe).not.toHaveBeenCalled();

    await expect(controller.release()).resolves.toEqual({
      kind: "transcript",
      transcript: "마법소녀가 직업이야?",
      audioLevel: level,
      observation: {
        text: "마법소녀가 직업이야?",
        model: "gpt-transcribe",
        roundTripMs: 320,
      },
    });
    expect(recording.stop).toHaveBeenCalledTimes(1);
    expect(transcription.transcribe).toHaveBeenCalledTimes(1);
    expect(transcription.transcribe).toHaveBeenCalledWith(wav, expect.any(AbortSignal));
  });

  it("cancel 후 늦게 도착한 전사 결과를 무시한다", async () => {
    let finish!: (value: {
      text: string;
      model: string;
      roundTripMs: number;
    }) => void;
    const pending = new Promise<{
      text: string;
      model: string;
      roundTripMs: number;
    }>((resolve) => {
      finish = resolve;
    });
    const recording: PttRecordingPort = {
      start: vi.fn(async () => undefined),
      stop: vi.fn(async () => ({
        wavBlob: new Blob(["voice"], { type: "audio/wav" }),
        level,
      })),
      cancel: vi.fn(),
    };
    const transcription: TranscriptionPort = {
      provider: "gemini",
      transcribe: vi.fn(() => pending),
    };
    const controller = new RecordedVoiceTurnController(recording, transcription);
    await controller.press();
    const result = controller.release();

    controller.cancel();
    finish({ text: "늦은 결과", model: "gemini-2.5-flash", roundTripMs: 900 });

    await expect(result).resolves.toEqual({ kind: "cancelled" });
    expect(recording.cancel).toHaveBeenCalledTimes(1);
  });
});
