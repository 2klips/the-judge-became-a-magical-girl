import {
  assetUrl,
  reportAssetLoadFailure,
  resolveBgmAsset,
} from "../assets/catalog";

export interface AudioChannel {
  src: string;
  loop: boolean;
  volume: number;
  currentTime: number;
  play(): Promise<void>;
  pause(): void;
  addEventListener(type: "error", listener: () => void, options?: AddEventListenerOptions): void;
}

type AudioFactory = () => AudioChannel;

export class BgmController {
  private current: { id: string; channel: AudioChannel } | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private ducked = false;

  constructor(
    private readonly createAudio: AudioFactory = () => new Audio(),
    private readonly fadeDurationMs = 600,
  ) {}

  async play(logicalId: string, loop = true): Promise<void> {
    if (this.current?.id === logicalId) return;
    const relativePath = resolveBgmAsset(logicalId);
    if (!relativePath) {
      reportAssetLoadFailure(logicalId, "(catalog)", "알 수 없는 BGM 논리 ID");
      return;
    }

    const next = this.createAudio();
    next.src = assetUrl(relativePath);
    next.loop = loop;
    next.volume = 0;
    next.addEventListener(
      "error",
      () => reportAssetLoadFailure(logicalId, relativePath),
      { once: true },
    );

    try {
      await next.play();
    } catch (error) {
      if (error instanceof DOMException && error.name === "NotAllowedError") return;
      reportAssetLoadFailure(
        logicalId,
        relativePath,
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    const previous = this.current?.channel ?? null;
    this.current = { id: logicalId, channel: next };
    this.crossfade(previous, next);
  }

  stop(): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
    this.current?.channel.pause();
    this.current = null;
  }

  setDucked(ducked: boolean): void {
    this.ducked = ducked;
    if (this.current) this.current.channel.volume = this.targetVolume();
  }

  private crossfade(previous: AudioChannel | null, next: AudioChannel): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const steps = 12;
    let step = 0;
    this.fadeTimer = setInterval(() => {
      step += 1;
      const progress = Math.min(1, step / steps);
      const target = this.targetVolume();
      next.volume = progress * target;
      if (previous) previous.volume = (1 - progress) * target;
      if (progress < 1) return;
      if (this.fadeTimer) clearInterval(this.fadeTimer);
      this.fadeTimer = null;
      previous?.pause();
    }, Math.max(16, this.fadeDurationMs / steps));
  }


  private targetVolume(): number {
    return this.ducked ? 0.18 : 1;
  }
}
