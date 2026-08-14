import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolvePttLiveLevelPresentation,
  type AudioLevelMetrics,
} from "../src/input/audioLevel";
import { beginBrowserRecording } from "../src/input/recording";

type Listener = (event: { data: Blob }) => void;
type FailurePoint =
  | "context"
  | "source"
  | "analyser"
  | "connect"
  | "raf"
  | "sample"
  | "observer";

function createBrowserHarness(
  failure?: FailurePoint,
  recorderFailure?: "construct" | "start" | "error" | "deferred-stop",
) {
  const track = { stop: vi.fn() };
  const stream = { getTracks: vi.fn(() => [track]) };
  const getUserMedia = vi.fn(async () => stream);
  const source = { connect: vi.fn(), disconnect: vi.fn() };
  if (failure === "connect") source.connect.mockImplementation(() => { throw new Error("connect"); });
  const samples = [0, 0.063, 0.7];
  let sampleIndex = 0;
  const analyser = {
    fftSize: 0,
    disconnect: vi.fn(),
    getFloatTimeDomainData: vi.fn((buffer: Float32Array) => {
      if (failure === "sample") throw new Error("sample");
      buffer.fill(samples[Math.min(sampleIndex, samples.length - 1)] ?? 0);
      sampleIndex += 1;
    }),
  };
  const close = vi.fn(async () => undefined);
  class FakeAudioContext {
    constructor() {
      if (failure === "context") throw new Error("context");
    }
    createMediaStreamSource() {
      if (failure === "source") throw new Error("source");
      return source;
    }
    createAnalyser() {
      if (failure === "analyser") throw new Error("analyser");
      return analyser;
    }
    close = close;
  }

  const frames = new Map<number, FrameRequestCallback>();
  let nextFrameId = 1;
  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    if (failure === "raf") throw new Error("raf");
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  const cancelAnimationFrame = vi.fn((id: number) => {
    frames.delete(id);
  });
  const runNextFrame = () => {
    const entry = frames.entries().next().value as [number, FrameRequestCallback] | undefined;
    if (!entry) return;
    frames.delete(entry[0]);
    entry[1](performance.now());
  };

  let recorder: FakeMediaRecorder | undefined;
  class FakeMediaRecorder {
    static isTypeSupported = vi.fn(() => true);
    state: RecordingState = "inactive";
    mimeType = "audio/webm";
    private readonly listeners = new Map<string, Set<Listener>>();
    addEventListener = vi.fn((type: string, listener: Listener) => {
      const set = this.listeners.get(type) ?? new Set<Listener>();
      set.add(listener);
      this.listeners.set(type, set);
    });
    removeEventListener = vi.fn((type: string, listener: Listener) => {
      this.listeners.get(type)?.delete(listener);
    });
    constructor(readonly capturedStream: typeof stream) {
      if (recorderFailure === "construct") throw new Error("construct");
      recorder = this;
    }
    start = vi.fn(() => {
      if (recorderFailure === "start") throw new Error("start");
      this.state = "recording";
    });
    stop = vi.fn(() => {
      this.state = "inactive";
      if (recorderFailure === "deferred-stop") return;
      if (recorderFailure === "error") {
        this.emit("error", { data: new Blob() });
        return;
      }
      this.emit("dataavailable", { data: new Blob(["voice"]) });
      this.emit("stop", { data: new Blob() });
    });
    private emit(type: string, event: { data: Blob }) {
      for (const listener of [...(this.listeners.get(type) ?? [])]) listener(event);
    }
  }

  vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);
  vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);

  return {
    track,
    stream,
    getUserMedia,
    source,
    analyser,
    close,
    recorder: () => recorder,
    requestAnimationFrame,
    cancelAnimationFrame,
    runNextFrame,
  };
}

describe("PTT live meter", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [{ rmsDbfs: -60, peakDbfs: -50, clippingRatio: 0 }, 0, "quiet"],
    [{ rmsDbfs: -24, peakDbfs: -8, clippingRatio: 0 }, 60, "good"],
    [{ rmsDbfs: -4, peakDbfs: -0.2, clippingRatio: 0.01 }, 93, "loud"],
  ] as const)("live level을 %s fill과 %s tone으로 바꾼다", (metrics, percent, tone) => {
    expect(resolvePttLiveLevelPresentation(metrics)).toEqual({ percent, tone });
  });

  it("하나의 stream을 recorder와 analyser가 공유하고 finish에서 한 번 정리한다", async () => {
    const harness = createBrowserHarness();
    const levels: Array<AudioLevelMetrics | null> = [];
    const session = await beginBrowserRecording(undefined, (level) => levels.push(level));

    expect(harness.getUserMedia).toHaveBeenCalledTimes(1);
    expect(harness.recorder()?.capturedStream).toBe(harness.stream);
    expect(harness.source.connect).toHaveBeenCalledWith(harness.analyser);
    harness.runNextFrame();
    harness.runNextFrame();
    harness.runNextFrame();
    expect(
      levels
        .filter((level): level is AudioLevelMetrics => level !== null)
        .map((level) => resolvePttLiveLevelPresentation(level).tone),
    ).toEqual(["quiet", "good", "loud"]);

    await expect(session.finish()).resolves.toBeInstanceOf(Blob);
    expect(harness.cancelAnimationFrame).toHaveBeenCalledTimes(1);
    expect(harness.source.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.analyser.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.close).toHaveBeenCalledTimes(1);
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(levels.at(-1)).toBeNull();
  });

  it("abort는 모든 recording·meter resource를 멱등 정리한다", async () => {
    const harness = createBrowserHarness(undefined, "deferred-stop");
    const session = await beginBrowserRecording(undefined, vi.fn());
    session.abort();
    session.abort();
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(harness.source.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.analyser.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.close).toHaveBeenCalledTimes(1);
  });

  it("recorder error는 지정 오류로 reject하고 한 번 정리한다", async () => {
    const harness = createBrowserHarness(undefined, "error");
    const session = await beginBrowserRecording(undefined, vi.fn());
    await expect(session.finish()).rejects.toThrow("브라우저 녹음 중 오류가 발생했습니다.");
    expect(harness.track.stop).toHaveBeenCalledTimes(1);
    expect(harness.source.disconnect).toHaveBeenCalledTimes(1);
    expect(harness.close).toHaveBeenCalledTimes(1);
    expect(harness.recorder()?.removeEventListener).toHaveBeenCalled();
  });

  it.each(["context", "source", "analyser", "connect", "raf", "sample", "observer"] as const)(
    "meter %s 실패는 recording을 계속하고 no-fill로 강등한다",
    async (failure) => {
      const harness = createBrowserHarness(failure);
      const levels: Array<AudioLevelMetrics | null> = [];
      const observer = failure === "observer"
        ? vi.fn(() => { throw new Error("observer"); })
        : vi.fn((level: AudioLevelMetrics | null) => levels.push(level));
      const session = await beginBrowserRecording(undefined, observer);
      if (failure === "sample" || failure === "observer") harness.runNextFrame();

      expect(harness.getUserMedia).toHaveBeenCalledTimes(1);
      expect(harness.track.stop).not.toHaveBeenCalled();
      expect(harness.recorder()?.stop).not.toHaveBeenCalled();
      await expect(session.finish()).resolves.toMatchObject({ size: expect.any(Number) });
      expect(harness.track.stop).toHaveBeenCalledTimes(1);
      if (failure !== "observer") expect(levels.at(-1)).toBeNull();
    },
  );

  it.each(["construct", "start"] as const)(
    "MediaRecorder %s 실패는 recording-terminal로 track을 정리한다",
    async (failure) => {
      const harness = createBrowserHarness(undefined, failure);
      await expect(beginBrowserRecording(undefined, vi.fn())).rejects.toThrow(failure);
      expect(harness.track.stop).toHaveBeenCalledTimes(1);
    },
  );
});
