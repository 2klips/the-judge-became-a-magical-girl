export type SfxCue =
  | "confirm"
  | "cast"
  | "critical"
  | "impact"
  | "recognition_fail"
  | "advance"
  | "guard"
  | "wraith_shift"
  | "ending";

interface ToneLayer {
  readonly type: OscillatorType;
  readonly startHz: number;
  readonly endHz: number;
  readonly offset: number;
  readonly duration: number;
  readonly gain: number;
}

const MASTER_GAIN = 0.58;
const DUPLICATE_WINDOW_MS = 40;

const cueLayers: Record<SfxCue, readonly ToneLayer[]> = {
  confirm: [
    { type: "sine", startHz: 520, endHz: 620, offset: 0, duration: 0.13, gain: 0.07 },
    { type: "sine", startHz: 760, endHz: 840, offset: 0.045, duration: 0.12, gain: 0.045 },
  ],
  cast: [
    { type: "sine", startHz: 330, endHz: 880, offset: 0, duration: 0.28, gain: 0.075 },
    { type: "triangle", startHz: 520, endHz: 1_120, offset: 0.06, duration: 0.24, gain: 0.048 },
  ],
  critical: [
    { type: "sine", startHz: 640, endHz: 760, offset: 0, duration: 0.13, gain: 0.064 },
    { type: "sine", startHz: 820, endHz: 980, offset: 0.065, duration: 0.14, gain: 0.062 },
    { type: "sine", startHz: 1_060, endHz: 1_420, offset: 0.13, duration: 0.2, gain: 0.058 },
  ],
  impact: [
    { type: "square", startHz: 170, endHz: 76, offset: 0, duration: 0.18, gain: 0.075 },
    { type: "triangle", startHz: 96, endHz: 54, offset: 0.015, duration: 0.24, gain: 0.055 },
  ],
  recognition_fail: [
    { type: "sine", startHz: 340, endHz: 250, offset: 0, duration: 0.16, gain: 0.052 },
    { type: "sine", startHz: 250, endHz: 170, offset: 0.12, duration: 0.18, gain: 0.045 },
  ],
  advance: [
    { type: "sine", startHz: 680, endHz: 780, offset: 0, duration: 0.09, gain: 0.026 },
    { type: "sine", startHz: 900, endHz: 960, offset: 0.035, duration: 0.08, gain: 0.018 },
  ],
  guard: [
    { type: "sine", startHz: 210, endHz: 310, offset: 0, duration: 0.28, gain: 0.064 },
    { type: "triangle", startHz: 420, endHz: 360, offset: 0.04, duration: 0.24, gain: 0.042 },
  ],
  wraith_shift: [
    { type: "triangle", startHz: 180, endHz: 620, offset: 0, duration: 0.36, gain: 0.052 },
    { type: "sine", startHz: 480, endHz: 1_080, offset: 0.08, duration: 0.3, gain: 0.038 },
  ],
  ending: [
    { type: "sine", startHz: 392, endHz: 392, offset: 0, duration: 0.34, gain: 0.045 },
    { type: "sine", startHz: 494, endHz: 494, offset: 0.04, duration: 0.34, gain: 0.036 },
    { type: "sine", startHz: 659, endHz: 659, offset: 0.08, duration: 0.34, gain: 0.03 },
  ],
};

type AudioContextFactory = () => AudioContext | null;

function browserAudioContextFactory(): AudioContext | null {
  const AudioContextConstructor = window.AudioContext;
  if (!AudioContextConstructor) return null;
  try {
    return new AudioContextConstructor();
  } catch {
    return null;
  }
}

export class SfxPlayer {
  private context: AudioContext | null = null;
  private suppressed = false;
  private readonly lastPlayedAt = new Map<SfxCue, number>();

  constructor(
    private readonly createContext: AudioContextFactory = browserAudioContextFactory,
    private readonly now: () => number = () => performance.now(),
  ) {}

  setSuppressed(suppressed: boolean): void {
    this.suppressed = suppressed;
  }

  play(cue: SfxCue): boolean {
    if (this.suppressed) return false;
    const now = this.now();
    const previous = this.lastPlayedAt.get(cue);
    if (previous !== undefined && now - previous < DUPLICATE_WINDOW_MS) return false;
    try {
      this.context ??= this.createContext();
    } catch {
      return false;
    }
    const context = this.context;
    if (!context) return false;
    this.lastPlayedAt.set(cue, now);
    try {
      void context.resume().catch(() => undefined);
      const start = context.currentTime;
      for (const layer of cueLayers[cue]) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const layerStart = start + layer.offset;
        const layerEnd = layerStart + layer.duration;
        oscillator.type = layer.type;
        oscillator.frequency.setValueAtTime(layer.startHz, layerStart);
        oscillator.frequency.exponentialRampToValueAtTime(layer.endHz, layerEnd);
        gain.gain.setValueAtTime(0.0001, layerStart);
        gain.gain.exponentialRampToValueAtTime(
          Math.max(0.0001, layer.gain * MASTER_GAIN),
          layerStart + Math.min(0.025, layer.duration * 0.22),
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, layerEnd);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(layerStart);
        oscillator.stop(layerEnd + 0.01);
      }
      return true;
    } catch {
      return false;
    }
  }
}
