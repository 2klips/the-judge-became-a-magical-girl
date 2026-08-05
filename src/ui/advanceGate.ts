export const DIALOGUE_ADVANCE_DELAY_MS = 1_500;

interface DelayedActionGateOptions {
  delayMs: number;
  onReadyChange(ready: boolean): void;
  onAction(): void;
}

export class DelayedActionGate {
  private ready = false;
  private used = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: DelayedActionGateOptions) {}

  arm(): void {
    if (this.timer) clearTimeout(this.timer);
    this.ready = false;
    this.used = false;
    this.options.onReadyChange(false);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.ready = true;
      this.options.onReadyChange(true);
    }, this.options.delayMs);
  }

  trigger(): boolean {
    if (!this.ready || this.used) return false;
    this.used = true;
    this.options.onAction();
    return true;
  }

  cancel(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.ready = false;
  }
}
