export type SfxCue =
  | "confirm"
  | "cast"
  | "critical"
  | "impact"
  | "recognition_fail";

const cueFrequencies: Record<SfxCue, readonly [number, number]> = {
  confirm: [520, 760],
  cast: [360, 880],
  critical: [640, 1_280],
  impact: [160, 90],
  recognition_fail: [260, 180],
};

export class SfxPlayer {
  private context: AudioContext | null = null;

  play(cue: SfxCue): void {
    const AudioContextConstructor = window.AudioContext;
    if (!AudioContextConstructor) return;
    this.context ??= new AudioContextConstructor();
    const context = this.context;
    void context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const [start, end] = cueFrequencies[cue];
    const now = context.currentTime;
    oscillator.type = cue === "impact" ? "square" : "sine";
    oscillator.frequency.setValueAtTime(start, now);
    oscillator.frequency.exponentialRampToValueAtTime(end, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.22);
  }
}
