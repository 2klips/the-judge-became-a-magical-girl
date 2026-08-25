import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  calculateAudioLevel,
  evaluateVoiceLevel,
  MicrophoneCalibrationAccumulator,
  resolveMicrophoneMeterPresentation,
  resolveVoiceLevelFailure,
} from "../src/input/audioLevel";
import {
  TitleMicrophoneSession,
  type TitleMicrophoneOptions,
} from "../src/ui/titleView";
import {
  BrowserMicrophoneTester,
  resolveMicrophoneConnection,
} from "../src/input/microphoneSetup";
const stylesSource = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const titleViewSource = readFileSync(new URL("../src/ui/titleView.ts", import.meta.url), "utf8");

const signal = (amplitude: number, length = 1_600): Float32Array =>
  Float32Array.from({ length }, (_, index) => Math.sin(index / 8) * amplitude);

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it("헤드셋의 고립 peak는 허용하고 지속 RMS·실제 clipping만 too-loud로 판정한다", () => {
    const calibration = {
      targetRmsDbfs: -24,
      minimumRmsDbfs: -36,
      maximumRmsDbfs: -14,
      maximumPeakDbfs: -0.75,
    };
    const isolatedPeak = signal(0.12, 2_048);
    isolatedPeak[1_024] = 1;
    const meaningfulClipping = signal(0.12, 2_048);
    for (let index = 0; index < 42; index += 1) meaningfulClipping[index] = 1;

    const isolatedMetrics = calculateAudioLevel(isolatedPeak);
    expect(isolatedMetrics.peakDbfs).toBe(0);
    expect(isolatedMetrics.clippingRatio).toBeLessThan(0.01);
    expect(evaluateVoiceLevel(isolatedMetrics, calibration)).toBe("acceptable");
    expect(
      evaluateVoiceLevel(
        calculateAudioLevel(Float32Array.from({ length: 2_048 }, () => 0.5)),
        calibration,
      ),
    ).toBe("too-loud");
    expect(evaluateVoiceLevel(calculateAudioLevel(meaningfulClipping), calibration)).toBe(
      "too-loud",
    );
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
    const connectStart = titleViewSource.indexOf("private async connect");
    const connectEnd = titleViewSource.indexOf("private emit", connectStart);
    const connectSection = titleViewSource.slice(connectStart, connectEnd);
    const resetLevel = connectSection.indexOf('this.level = { percent: 0, tone: "quiet" }');
    const connectCall = connectSection.indexOf("this.microphone.connect");

    expect(resetLevel).toBeGreaterThan(-1);
    expect(connectCall).toBeGreaterThan(resetLevel);
    expect(titleViewSource).not.toContain("dBFS");
  });

  it("meter tone CSS만 사용하고 고정 red marker는 표시하지 않는다", () => {
    expect(stylesSource).not.toMatch(/\.microphone-meter::after\s*\{/);
    expect(stylesSource).toContain('.microphone-meter[data-tone="quiet"]');
    expect(stylesSource).toContain('.microphone-meter[data-tone="good"]');
    expect(stylesSource).toContain('.microphone-meter[data-tone="loud"]');
  });
});

function createTitleMicrophoneHarness(options?: {
  supported?: boolean;
  connectError?: unknown;
  permission?: PermissionState | "unknown";
}) {
  let level: ((metrics: { rmsDbfs: number; peakDbfs: number; clippingRatio: number }) => void) | null = null;
  let deviceChange: (() => void) | null = null;
  let now = 0;
  const microphone: TitleMicrophoneOptions = {
    supported: options?.supported ?? true,
    connect: vi.fn(async (_deviceId, onLevel) => {
      if (options?.connectError) throw options.connectError;
      level = onLevel;
      return {
        devices: [{ deviceId: "corsair", label: "CORSAIR VOID WIRELESS v2" }],
        selectedDeviceId: "corsair",
      };
    }),
    disconnect: vi.fn(async () => undefined),
    queryPermission: vi.fn(async () => options?.permission ?? "prompt"),
    subscribeDeviceChange: vi.fn((listener) => {
      deviceChange = listener;
      return vi.fn(() => {
        deviceChange = null;
      });
    }),
  };
  const changes = vi.fn();
  const session = new TitleMicrophoneSession(microphone, changes, () => now);
  return {
    microphone,
    session,
    changes,
    emitLevel(metrics = { rmsDbfs: -24, peakDbfs: -18, clippingRatio: 0 }) {
      now += 50;
      level?.(metrics);
    },
    emitDeviceChange() {
      deviceChange?.();
    },
  };
}

describe("TITLE microphone session", () => {
  it("enumerateDevices가 비어도 활성 audio track을 현재 장치로 유지한다", () => {
    const connection = resolveMicrophoneConnection(
      [],
      {
        label: "헤드셋 마이크(CORSAIR VOID WIRELESS v2)",
        getSettings: () => ({ deviceId: "corsair" }),
      },
      undefined,
    );

    expect(connection).toEqual({
      devices: [{ deviceId: "corsair", label: "헤드셋 마이크(CORSAIR VOID WIRELESS v2)" }],
      selectedDeviceId: "corsair",
    });
  });

  it("render/settings open은 연결하지 않고 explicit setup만 한 stream을 연다", async () => {
    const harness = createTitleMicrophoneHarness();
    harness.session.start();
    expect(harness.microphone.connect).not.toHaveBeenCalled();
    expect(harness.microphone.subscribeDeviceChange).toHaveBeenCalledTimes(1);

    await harness.session.requestSetup();
    expect(harness.microphone.connect).toHaveBeenCalledTimes(1);
    expect(harness.session.snapshot()).toMatchObject({
      state: "READY",
      selectedDeviceId: "corsair",
      deviceLabel: "CORSAIR VOID WIRELESS v2",
    });
  });

  it("READY sample은 보정하지 않고 test/retest가 같은 callback을 재사용한다", async () => {
    const harness = createTitleMicrophoneHarness();
    harness.session.start();
    await harness.session.requestSetup();
    harness.emitLevel();
    expect(harness.session.snapshot()).toMatchObject({ state: "READY", calibration: null });

    harness.session.startTest();
    for (let index = 0; index < 18; index += 1) harness.emitLevel();
    expect(harness.session.snapshot().state).toBe("TEST_SUCCESS");
    expect(harness.session.snapshot().calibration).not.toBeNull();
    expect(harness.microphone.connect).toHaveBeenCalledTimes(1);

    harness.emitLevel();
    expect(harness.session.snapshot().state).toBe("TEST_SUCCESS");
    harness.session.startTest();
    expect(harness.session.snapshot().state).toBe("TESTING");
    expect(harness.microphone.connect).toHaveBeenCalledTimes(1);
  });

  it("devicechange는 active 연결만 재연결하고 destroy가 한 번 해제한다", async () => {
    const harness = createTitleMicrophoneHarness();
    harness.session.start();
    harness.emitDeviceChange();
    expect(harness.microphone.connect).not.toHaveBeenCalled();

    await harness.session.requestSetup();
    harness.emitDeviceChange();
    await vi.waitFor(() => expect(harness.microphone.connect).toHaveBeenCalledTimes(2));
    expect(harness.session.snapshot().state).toBe("READY");

    await harness.session.destroy();
    await harness.session.destroy();
    expect(harness.microphone.disconnect).toHaveBeenCalledTimes(2);
    const unsubscribe = vi.mocked(harness.microphone.subscribeDeviceChange).mock.results[0]?.value;
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("연결 대기 중 화면이 교체되면 늦게 열린 TITLE stream도 정리한다", async () => {
    let resolveConnection!: (connection: {
      devices: { deviceId: string; label: string }[];
      selectedDeviceId: string;
    }) => void;
    const microphone: TitleMicrophoneOptions = {
      supported: true,
      connect: vi.fn(() => new Promise<{
        devices: { deviceId: string; label: string }[];
        selectedDeviceId: string;
      }>((resolve) => {
        resolveConnection = resolve;
      })),
      disconnect: vi.fn(async () => undefined),
      queryPermission: vi.fn(async () => "prompt" as PermissionState),
      subscribeDeviceChange: vi.fn(() => vi.fn()),
    };
    const session = new TitleMicrophoneSession(microphone, vi.fn());
    session.start();
    const setup = session.requestSetup();
    const destroy = session.destroy();
    resolveConnection({
      devices: [{ deviceId: "corsair", label: "CORSAIR" }],
      selectedDeviceId: "corsair",
    });
    await Promise.all([setup, destroy]);

    expect(microphone.disconnect).toHaveBeenCalledTimes(2);
    expect(session.snapshot().state).toBe("REQUESTING_PERMISSION");
  });

  it.each([
    [false, undefined, "unknown", "UNSUPPORTED"],
    [true, new DOMException("denied", "NotAllowedError"), "denied", "DENIED"],
    [true, new DOMException("missing", "NotFoundError"), "prompt", "NO_DEVICE"],
    [true, new Error("boom"), "prompt", "ERROR"],
  ] as const)("supported=%s failure를 %s로 분리한다", async (supported, error, permission, expected) => {
    const harness = createTitleMicrophoneHarness({ supported, connectError: error, permission });
    harness.session.start();
    await harness.session.requestSetup();
    expect(harness.session.snapshot().state).toBe(expected);
    if (!supported) expect(harness.microphone.connect).not.toHaveBeenCalled();
  });
});

describe("BrowserMicrophoneTester device constraint characterization", () => {
  it.each([
    [undefined, undefined],
    ["device-A", { exact: "device-A" }],
  ] as const)("deviceId=%s일 때 exact constraint를 필요한 경우만 사용한다", async (deviceId, expected) => {
    const track = {
      label: "Device A",
      stop: vi.fn(),
      getSettings: () => ({ deviceId: "device-A" }),
    };
    const stream = {
      getTracks: () => [track],
      getAudioTracks: () => [track],
    };
    const getUserMedia = vi.fn(async (_constraints: MediaStreamConstraints) => stream);
    vi.stubGlobal("navigator", {
      mediaDevices: {
        getUserMedia,
        enumerateDevices: vi.fn(async () => [{
          kind: "audioinput",
          deviceId: "device-A",
          label: "Device A",
        }]),
      },
    });
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const analyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      disconnect: vi.fn(),
      getFloatTimeDomainData: vi.fn(),
    };
    const context = {
      state: "running",
      createMediaStreamSource: vi.fn(() => source),
      createAnalyser: vi.fn(() => analyser),
      close: vi.fn(async () => undefined),
    };
    vi.stubGlobal("AudioContext", class {
      constructor() {
        return context;
      }
    });
    vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
    vi.stubGlobal("cancelAnimationFrame", vi.fn());

    const tester = new BrowserMicrophoneTester();
    await tester.connect(deviceId, vi.fn());

    const constraints = getUserMedia.mock.calls[0]?.[0] as MediaStreamConstraints;
    const audio = constraints.audio as MediaTrackConstraints;
    expect(audio.deviceId).toEqual(expected);
    await tester.disconnect();
  });
});
