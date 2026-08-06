import { describe, expect, it } from "vitest";
import {
  calculateAudioLevel,
  evaluateVoiceLevel,
  MicrophoneCalibrationAccumulator,
  resolveVoiceLevelFailure,
} from "../src/input/audioLevel";

const signal = (amplitude: number, length = 1_600): Float32Array =>
  Float32Array.from({ length }, (_, index) => Math.sin(index / 8) * amplitude);

describe("M5 마이크 레벨 계약", () => {
  it("PCM에서 RMS·peak dBFS를 계산한다", () => {
    const level = calculateAudioLevel(signal(0.25));
    expect(level.rmsDbfs).toBeGreaterThan(-16);
    expect(level.rmsDbfs).toBeLessThan(-14);
    expect(level.peakDbfs).toBeCloseTo(-12.04, 1);
    expect(level.clippingRatio).toBe(0);
  });

  it("충분한 정상 음성만 테스트를 통과시키고 적응형 범위를 만든다", () => {
    const accumulator = new MicrophoneCalibrationAccumulator();
    const level = calculateAudioLevel(signal(0.18));
    for (let index = 0; index < 18; index += 1) accumulator.add(level, 50);

    expect(accumulator.state).toBe("passed");
    expect(accumulator.progress).toBe(1);
    const calibration = accumulator.calibration();
    expect(calibration).not.toBeNull();
    expect(calibration?.minimumRmsDbfs).toBeLessThan(level.rmsDbfs);
    expect(calibration?.maximumRmsDbfs).toBeGreaterThan(level.rmsDbfs);

    accumulator.add(calculateAudioLevel(new Float32Array(2_048)), 1_000);
    expect(accumulator.state).toBe("passed");
    expect(accumulator.calibration()).toEqual(calibration);
  });

  it("무음과 clipping은 마이크 테스트를 통과시키지 않는다", () => {
    const quiet = new MicrophoneCalibrationAccumulator();
    quiet.add(calculateAudioLevel(new Float32Array(2_048)), 1_000);
    expect(quiet.state).toBe("too-quiet");
    expect(quiet.calibration()).toBeNull();

    const loud = new MicrophoneCalibrationAccumulator();
    loud.add(calculateAudioLevel(Float32Array.from({ length: 2_048 }, () => 1)), 1_000);
    expect(loud.state).toBe("too-loud");
    expect(loud.calibration()).toBeNull();
  });

  it("보정 범위 밖 전투 주문을 작음·큼으로 분리한다", () => {
    const calibration = {
      targetRmsDbfs: -24,
      minimumRmsDbfs: -36,
      maximumRmsDbfs: -14,
      maximumPeakDbfs: -0.75,
    };
    expect(evaluateVoiceLevel(calculateAudioLevel(signal(0.005)), calibration)).toBe(
      "too-quiet",
    );
    expect(evaluateVoiceLevel(calculateAudioLevel(signal(0.12)), calibration)).toBe(
      "acceptable",
    );
    expect(
      evaluateVoiceLevel(
        calculateAudioLevel(Float32Array.from({ length: 2_048 }, () => 1)),
        calibration,
      ),
    ).toBe("too-loud");
  });

  it("같은 전투 턴의 첫 음량 실패만 무료 재시도한다", () => {
    expect(resolveVoiceLevelFailure(0)).toBe("retry");
    expect(resolveVoiceLevelFailure(1)).toBe("consume-turn");
    expect(resolveVoiceLevelFailure(2)).toBe("consume-turn");
  });
});
