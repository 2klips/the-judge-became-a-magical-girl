import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  calculateAudioLevel,
  evaluateVoiceLevel,
  MicrophoneCalibrationAccumulator,
  resolveMicrophoneMeterPresentation,
  resolveVoiceLevelFailure,
} from "../src/input/audioLevel";
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const titleViewSource = readFileSync(new URL("../src/ui/titleView.ts", import.meta.url), "utf8");

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

  it.each([
    [-55, "too-quiet", "quiet"],
    [-24, "sampling", "good"],
    [-5, "too-loud", "loud"],
  ] as const)("%d dBFS와 %s 판정을 %s meter tone으로 표시한다", (rmsDbfs, state, tone) => {
    expect(
      resolveMicrophoneMeterPresentation(
        { rmsDbfs, peakDbfs: rmsDbfs, clippingRatio: 0 },
        state,
      ),
    ).toMatchObject({ tone });
  });

  it("누적 보정 진행과 별개로 현재 sample의 waiting·quiet·passed·loud tone을 표시한다", () => {
    const accumulator = new MicrophoneCalibrationAccumulator();
    const acceptable = { rmsDbfs: -24, peakDbfs: -20, clippingRatio: 0 };

    expect(resolveMicrophoneMeterPresentation(acceptable, accumulator.state)).toMatchObject({
      tone: "quiet",
    });
    expect(accumulator.add(acceptable, 50)).toBe("sampling");

    const quiet = { rmsDbfs: -55, peakDbfs: -50, clippingRatio: 0 };
    const samplingAfterQuiet = accumulator.add(quiet, 50);
    expect(samplingAfterQuiet).toBe("sampling");
    expect(resolveMicrophoneMeterPresentation(quiet, samplingAfterQuiet)).toMatchObject({
      tone: "quiet",
    });

    for (let index = 0; index < 17; index += 1) accumulator.add(acceptable, 50);
    expect(accumulator.state).toBe("passed");
    expect(resolveMicrophoneMeterPresentation(acceptable, accumulator.state)).toMatchObject({
      tone: "good",
    });

    const loud = { rmsDbfs: -5, peakDbfs: -0.5, clippingRatio: 0 };
    expect(accumulator.add(loud, 50)).toBe("passed");
    expect(resolveMicrophoneMeterPresentation(loud, accumulator.state)).toMatchObject({
      tone: "loud",
    });
  });

  it("재연결 전에 compact TITLE meter를 waiting 상태로 초기화한다", () => {
    const connectStart = titleViewSource.indexOf("const connect = async");
    const connectEnd = titleViewSource.indexOf("connectButton.addEventListener", connectStart);
    const connectSection = titleViewSource.slice(connectStart, connectEnd);
    const resetLevel = connectSection.indexOf(
      'meter.style.setProperty("--title-mic-level", "0%")',
    );
    const resetTone = connectSection.indexOf('meter.dataset.tone = "quiet"');
    const connectCall = connectSection.indexOf("this.options.connectMicrophone");

    expect(resetLevel).toBeGreaterThan(-1);
    expect(resetTone).toBeGreaterThan(resetLevel);
    expect(connectCall).toBeGreaterThan(resetTone);
    expect(titleViewSource).not.toContain("dBFS");
  });

  it("meter tone CSS만 사용하고 고정 red marker는 표시하지 않는다", () => {
    expect(stylesSource).not.toMatch(/\.microphone-meter::after\s*\{/);
    expect(stylesSource).toContain('.microphone-meter[data-tone="quiet"]');
    expect(stylesSource).toContain('.microphone-meter[data-tone="good"]');
    expect(stylesSource).toContain('.microphone-meter[data-tone="loud"]');
  });
});
