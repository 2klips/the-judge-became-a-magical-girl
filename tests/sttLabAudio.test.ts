import { describe, expect, it } from "vitest";
import { normalizeRecordedAudio } from "../src/stt-lab/audio";

describe("STT Lab audio normalization", () => {
  it("입력을 16 kHz mono PCM16 WAV와 동일한 Float32 샘플로 변환한다", async () => {
    const source = new Blob(["recorded"], { type: "audio/webm" });

    const normalized = await normalizeRecordedAudio(source, async (received) => {
      expect(received).toBe(source);
      return {
        sampleRate: 8_000,
        channels: [new Float32Array([0, 0.5, -0.5, 1])],
      };
    });

    expect(normalized.samples).toEqual(
      new Float32Array([0, 0.25, 0.5, 0, -0.5, 0.25, 1, 1]),
    );
    expect(normalized.durationMs).toBe(0.5);
    expect(normalized.wavBlob.type).toBe("audio/wav");

    const view = new DataView(await normalized.wavBlob.arrayBuffer());
    expect(readAscii(view, 0, 4)).toBe("RIFF");
    expect(readAscii(view, 8, 4)).toBe("WAVE");
    expect(view.getUint16(22, true)).toBe(1);
    expect(view.getUint32(24, true)).toBe(16_000);
    expect(view.getUint16(34, true)).toBe(16);
    expect(view.getUint32(40, true)).toBe(16);
  });
});

function readAscii(view: DataView, offset: number, length: number): string {
  return Array.from({ length }, (_, index) => String.fromCharCode(view.getUint8(offset + index))).join("");
}
