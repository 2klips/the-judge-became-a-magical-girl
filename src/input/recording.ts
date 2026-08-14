import { calculateAudioLevel, type AudioLevelMetrics } from "./audioLevel";

export interface RecordingSession {
  finish(): Promise<Blob>;
  abort(): void;
}

export type LiveAudioLevelObserver = (metrics: AudioLevelMetrics | null) => void;
export type BeginRecording = (onLevel?: LiveAudioLevelObserver) => Promise<RecordingSession>;
export type PushToTalkState = "idle" | "starting" | "recording" | "stopping";

export interface PttRecordingPort {
  start(onLevel?: LiveAudioLevelObserver): Promise<void>;
  stop(): Promise<RecordedAudio>;
  cancel(): void;
}

export interface RecordedAudio {
  readonly wavBlob: Blob;
  readonly level: AudioLevelMetrics;
}

export interface DecodedAudio {
  sampleRate: number;
  channels: readonly Float32Array[];
}

export interface NormalizedAudio {
  wavBlob: Blob;
  samples: Float32Array;
  durationMs: number;
}

export type AudioDecoder = (blob: Blob) => Promise<DecodedAudio>;

const DEFAULT_TARGET_SAMPLE_RATE = 16_000;

export class PushToTalkCapture {
  state: PushToTalkState = "idle";

  private startPromise: Promise<void> | undefined;
  private finishPromise: Promise<Blob | null> | undefined;
  private session: RecordingSession | undefined;
  private cancelRequested = false;

  constructor(private readonly beginRecording: BeginRecording) {}

  async press(onLevel?: LiveAudioLevelObserver): Promise<void> {
    if (this.state !== "idle") return this.startPromise;

    this.cancelRequested = false;
    this.state = "starting";
    this.startPromise = this.beginRecording(onLevel)
      .then((session) => {
        if (this.cancelRequested) {
          session.abort();
          return;
        }
        this.session = session;
        if (this.state === "starting") this.state = "recording";
      })
      .catch((error: unknown) => {
        this.reset();
        throw error;
      });
    return this.startPromise;
  }

  release(): Promise<Blob | null> {
    if (this.state === "idle") return Promise.resolve(null);
    if (this.finishPromise) return this.finishPromise;

    this.state = "stopping";
    this.finishPromise = (async () => {
      try {
        await this.startPromise;
        return this.session ? await this.session.finish() : null;
      } finally {
        this.reset();
      }
    })();
    return this.finishPromise;
  }

  cancel(): void {
    this.cancelRequested = true;
    this.session?.abort();
    this.reset();
  }

  private reset(): void {
    this.state = "idle";
    this.startPromise = undefined;
    this.finishPromise = undefined;
    this.session = undefined;
  }
}

export class BrowserPttRecordingPort implements PttRecordingPort {
  private readonly capture: PushToTalkCapture;

  constructor(
    beginRecording: BeginRecording = beginBrowserRecording,
    private readonly decode: AudioDecoder = decodeWithBrowserAudioContext,
    private readonly targetSampleRate = DEFAULT_TARGET_SAMPLE_RATE,
  ) {
    this.capture = new PushToTalkCapture(beginRecording);
  }

  static isSupported(): boolean {
    if (typeof navigator === "undefined") return false;
    const browserNavigator = navigator as unknown as {
      mediaDevices?: { getUserMedia?: unknown };
    };
    return Boolean(
      typeof browserNavigator.mediaDevices?.getUserMedia === "function" &&
        typeof MediaRecorder !== "undefined",
    );
  }

  start(onLevel?: LiveAudioLevelObserver): Promise<void> {
    return this.capture.press(onLevel);
  }

  async stop(): Promise<RecordedAudio> {
    const recorded = await this.capture.release();
    if (!recorded) throw new Error("종료할 음성 녹음이 없습니다.");
    const normalized = await normalizeRecordedAudio(
      recorded,
      this.decode,
      this.targetSampleRate,
    );
    return {
      wavBlob: normalized.wavBlob,
      level: calculateAudioLevel(normalized.samples),
    };
  }

  cancel(): void {
    this.capture.cancel();
  }
}

export async function beginBrowserRecording(
  deviceIdOrOnLevel?: string | LiveAudioLevelObserver,
  explicitOnLevel?: LiveAudioLevelObserver,
): Promise<RecordingSession> {
  const deviceId = typeof deviceIdOrOnLevel === "string" ? deviceIdOrOnLevel : undefined;
  const onLevel =
    typeof deviceIdOrOnLevel === "function" ? deviceIdOrOnLevel : explicitOnLevel;
  if (!BrowserPttRecordingPort.isSupported()) {
    throw new Error("이 브라우저는 마이크 녹음을 지원하지 않습니다.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
      autoGainControl: true,
      echoCancellation: true,
      noiseSuppression: true,
    },
    video: false,
  });
  const stopTracks = (): void => {
    for (const track of stream.getTracks()) track.stop();
  };
  const mimeType = selectRecordingMimeType();
  let recorder: MediaRecorder;
  try {
    recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);
  } catch (error) {
    stopTracks();
    throw error;
  }
  const chunks: Blob[] = [];

  let meterDisposed = false;
  let meterContext: AudioContext | undefined;
  let meterSource: MediaStreamAudioSourceNode | undefined;
  let meterAnalyser: AnalyserNode | undefined;
  let meterFrame: number | undefined;

  const emitLevel = (metrics: AudioLevelMetrics | null): void => {
    try {
      onLevel?.(metrics);
    } catch {
      // Decorative observer failures must never stop recording.
    }
  };
  const disposeMeter = (reset = true): void => {
    if (meterDisposed) return;
    meterDisposed = true;
    if (meterFrame !== undefined) {
      try {
        cancelAnimationFrame(meterFrame);
      } catch {
        // Best-effort decorative cleanup.
      }
      meterFrame = undefined;
    }
    try {
      meterSource?.disconnect();
    } catch {
      // Best-effort decorative cleanup.
    }
    try {
      meterAnalyser?.disconnect();
    } catch {
      // Best-effort decorative cleanup.
    }
    try {
      void meterContext?.close().catch(() => undefined);
    } catch {
      // Best-effort decorative cleanup.
    }
    if (reset) emitLevel(null);
  };

  if (onLevel) {
    try {
      meterContext = new AudioContext();
      meterSource = meterContext.createMediaStreamSource(stream);
      meterAnalyser = meterContext.createAnalyser();
      meterAnalyser.fftSize = 2048;
      meterSource.connect(meterAnalyser);
      const samples = new Float32Array(meterAnalyser.fftSize);
      const sample = (): void => {
        if (meterDisposed || !meterAnalyser) return;
        try {
          meterAnalyser.getFloatTimeDomainData(samples);
          onLevel(calculateAudioLevel(samples));
          meterFrame = requestAnimationFrame(sample);
        } catch {
          disposeMeter(true);
        }
      };
      meterFrame = requestAnimationFrame(sample);
    } catch {
      disposeMeter(true);
    }
  }

  let recordingDisposed = false;
  let finishPromise: Promise<Blob> | undefined;
  let resolveFinish: ((blob: Blob) => void) | undefined;
  let rejectFinish: ((error: Error) => void) | undefined;

  const onDataAvailable = (event: BlobEvent): void => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  const disposeRecording = (): void => {
    if (recordingDisposed) return;
    recordingDisposed = true;
    disposeMeter(true);
    recorder.removeEventListener("dataavailable", onDataAvailable);
    recorder.removeEventListener("stop", onStop);
    recorder.removeEventListener("error", onError);
    stopTracks();
  };
  const onStop = (): void => {
    const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
    disposeRecording();
    resolveFinish?.(blob);
  };
  const onError = (): void => {
    const error = new Error("브라우저 녹음 중 오류가 발생했습니다.");
    disposeRecording();
    rejectFinish?.(error);
  };

  recorder.addEventListener("dataavailable", onDataAvailable);
  recorder.addEventListener("stop", onStop);
  recorder.addEventListener("error", onError);
  try {
    recorder.start();
  } catch (error) {
    disposeRecording();
    throw error;
  }
  return {
    finish() {
      if (finishPromise) return finishPromise;
      finishPromise = new Promise<Blob>((resolve, reject) => {
        resolveFinish = resolve;
        rejectFinish = reject;
        try {
          recorder.stop();
        } catch (error) {
          disposeRecording();
          reject(error);
        }
      });
      return finishPromise;
    },
    abort() {
      if (recordingDisposed) return;
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {
          // Recording cancellation still owns terminal cleanup.
        } finally {
          disposeRecording();
        }
      } else {
        disposeRecording();
      }
    },
  };
}

export async function normalizeRecordedAudio(
  source: Blob,
  decode: AudioDecoder,
  targetSampleRate = DEFAULT_TARGET_SAMPLE_RATE,
): Promise<NormalizedAudio> {
  const decoded = await decode(source);
  const mono = mixToMono(decoded);
  const samples = resampleLinear(mono, decoded.sampleRate, targetSampleRate);
  return {
    samples,
    wavBlob: encodePcm16Wav(samples, targetSampleRate),
    durationMs: (samples.length / targetSampleRate) * 1_000,
  };
}

export async function decodeWithBrowserAudioContext(blob: Blob): Promise<DecodedAudio> {
  const context = new AudioContext();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    return {
      sampleRate: buffer.sampleRate,
      channels: Array.from({ length: buffer.numberOfChannels }, (_, index) =>
        buffer.getChannelData(index).slice(),
      ),
    };
  } finally {
    await context.close();
  }
}

function mixToMono(decoded: DecodedAudio): Float32Array {
  if (!Number.isFinite(decoded.sampleRate) || decoded.sampleRate <= 0) {
    throw new Error("오디오 샘플 레이트가 올바르지 않습니다.");
  }
  const firstChannel = decoded.channels[0];
  if (!firstChannel?.length) throw new Error("오디오 샘플이 없습니다.");

  const mono = new Float32Array(firstChannel.length);
  for (const channel of decoded.channels) {
    if (channel.length !== mono.length) throw new Error("오디오 채널 길이가 일치하지 않습니다.");
    for (let index = 0; index < mono.length; index += 1) {
      mono[index] = (mono[index] ?? 0) + (channel[index] ?? 0) / decoded.channels.length;
    }
  }
  return mono;
}

function resampleLinear(
  source: Float32Array,
  sourceRate: number,
  targetRate: number,
): Float32Array {
  if (sourceRate === targetRate) return source.slice();
  const targetLength = Math.max(1, Math.round((source.length * targetRate) / sourceRate));
  const target = new Float32Array(targetLength);
  const ratio = sourceRate / targetRate;
  for (let index = 0; index < targetLength; index += 1) {
    const position = index * ratio;
    const leftIndex = Math.min(source.length - 1, Math.floor(position));
    const rightIndex = Math.min(source.length - 1, leftIndex + 1);
    const fraction = Math.min(1, position - leftIndex);
    const left = source[leftIndex] ?? 0;
    const right = source[rightIndex] ?? left;
    target[index] = left + (right - left) * fraction;
  }
  return target;
}

function encodePcm16Wav(samples: Float32Array, sampleRate: number): Blob {
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);
  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.max(-1, Math.min(1, samples[index] ?? 0));
    view.setInt16(44 + index * 2, Math.round(sample < 0 ? sample * 0x8000 : sample * 0x7fff), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function selectRecordingMimeType(): string | undefined {
  return ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"].find((candidate) =>
    MediaRecorder.isTypeSupported(candidate),
  );
}
