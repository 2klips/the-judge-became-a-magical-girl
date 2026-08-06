import {
  assetUrl,
  isAssetPathUnavailable,
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

export interface AutoplayGestureTarget {
  addEventListener(
    type: "pointerdown",
    listener: () => void,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener(type: "pointerdown", listener: () => void): void;
}

export const BGM_DEFAULT_VOLUME = 0.62;
export const BGM_DUCK_MULTIPLIER = 0.18;

export class BgmController {
  private current: { id: string; channel: AudioChannel } | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private ducked = false;
  private pendingAutoplay: { id: string; loop: boolean } | null = null;
  private autoplayListenerAttached = false;

  constructor(
    private readonly createAudio: AudioFactory = () => new Audio(),
    private readonly fadeDurationMs = 600,
    private readonly gestureTarget: AutoplayGestureTarget | null =
      typeof document === "undefined" ? null : document,
  ) {}

  async play(logicalId: string, loop = true): Promise<void> {
    if (this.current?.id === logicalId) {
      if (this.pendingAutoplay?.id !== logicalId) this.clearAutoplayRetry();
      return;
    }
    const relativePath = resolveBgmAsset(logicalId);
    if (!relativePath) {
      reportAssetLoadFailure(logicalId, "(catalog)", "알 수 없는 BGM 논리 ID");
      return;
    }
    if (isAssetPathUnavailable(relativePath)) return;

    const next = this.createAudio();
    next.src = assetUrl(relativePath);
    next.loop = loop;
    next.volume = 0;
    next.addEventListener(
      "error",
      () => {
        reportAssetLoadFailure(logicalId, relativePath);
        if (this.current?.channel === next) {
          next.pause();
          this.current = null;
        }
      },
      { once: true },
    );

    try {
      await next.play();
    } catch (error) {
      next.pause();
      if (error instanceof DOMException && error.name === "NotAllowedError") {
        this.queueAutoplayRetry(logicalId, loop);
        return;
      }
      reportAssetLoadFailure(
        logicalId,
        relativePath,
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    this.clearAutoplayRetry();
    const previous = this.current?.channel ?? null;
    this.current = { id: logicalId, channel: next };
    this.crossfade(previous, next);
  }

  stop(): void {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    this.fadeTimer = null;
    this.current?.channel.pause();
    this.current = null;
    this.clearAutoplayRetry();
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
    return BGM_DEFAULT_VOLUME * (this.ducked ? BGM_DUCK_MULTIPLIER : 1);
  }

  private readonly retryAutoplay = (): void => {
    const pending = this.pendingAutoplay;
    this.pendingAutoplay = null;
    this.autoplayListenerAttached = false;
    if (pending) void this.play(pending.id, pending.loop);
  };

  private queueAutoplayRetry(logicalId: string, loop: boolean): void {
    this.pendingAutoplay = { id: logicalId, loop };
    if (!this.gestureTarget || this.autoplayListenerAttached) return;
    this.autoplayListenerAttached = true;
    this.gestureTarget.addEventListener("pointerdown", this.retryAutoplay, {
      once: true,
    });
  }

  private clearAutoplayRetry(): void {
    this.pendingAutoplay = null;
    if (!this.gestureTarget || !this.autoplayListenerAttached) return;
    this.gestureTarget.removeEventListener("pointerdown", this.retryAutoplay);
    this.autoplayListenerAttached = false;
  }
}
