import { calculateAudioLevel, type AudioLevelMetrics } from "./audioLevel";

export interface MicrophoneInputDevice {
  readonly deviceId: string;
  readonly label: string;
}

export interface MicrophoneConnection {
  readonly devices: readonly MicrophoneInputDevice[];
  readonly selectedDeviceId: string;
}

export class BrowserMicrophoneTester {
  private stream: MediaStream | null = null;
  private context: AudioContext | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private frameId: number | null = null;

  static isSupported(): boolean {
    return Boolean(
      typeof navigator !== "undefined" &&
        typeof navigator.mediaDevices?.getUserMedia === "function" &&
        typeof AudioContext !== "undefined",
    );
  }

  async connect(
    deviceId: string | undefined,
    onLevel: (metrics: AudioLevelMetrics) => void,
  ): Promise<MicrophoneConnection> {
    await this.disconnect();
    if (!BrowserMicrophoneTester.isSupported()) {
      throw new Error("이 브라우저는 마이크 테스트를 지원하지 않습니다.");
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
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.35;
    source.connect(analyser);

    this.stream = stream;
    this.context = context;
    this.source = source;
    this.analyser = analyser;
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices())
        .filter(({ kind }) => kind === "audioinput")
        .map(({ deviceId: id, label }, index) => ({
          deviceId: id,
          label: label || `마이크 ${index + 1}`,
        }));
      const selectedDeviceId =
        stream.getAudioTracks()[0]?.getSettings().deviceId ?? deviceId ?? "";
      this.readLevels(onLevel);
      return { devices, selectedDeviceId };
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.frameId !== null) cancelAnimationFrame(this.frameId);
    this.frameId = null;
    this.source?.disconnect();
    this.analyser?.disconnect();
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    const context = this.context;
    this.stream = null;
    this.source = null;
    this.analyser = null;
    this.context = null;
    if (context && context.state !== "closed") await context.close();
  }

  private readLevels(onLevel: (metrics: AudioLevelMetrics) => void): void {
    const analyser = this.analyser;
    if (!analyser) return;
    const samples = new Float32Array(analyser.fftSize);
    const tick = (): void => {
      if (this.analyser !== analyser) return;
      analyser.getFloatTimeDomainData(samples);
      onLevel(calculateAudioLevel(samples));
      this.frameId = requestAnimationFrame(tick);
    };
    tick();
  }
}
