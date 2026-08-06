export interface PushToTalkShortcutBinding {
  begin(): void | Promise<void>;
  finish(): void | Promise<void>;
}

export class PushToTalkShortcutController {
  private activeBinding: PushToTalkShortcutBinding | null = null;

  keyDown(
    key: string,
    repeat: boolean,
    binding: PushToTalkShortcutBinding,
  ): boolean {
    if (!isPushToTalkShortcutKey(key) || repeat || this.activeBinding) return false;
    this.activeBinding = binding;
    void binding.begin();
    return true;
  }

  keyUp(key: string): boolean {
    if (!isPushToTalkShortcutKey(key) || !this.activeBinding) return false;
    const binding = this.activeBinding;
    this.activeBinding = null;
    void binding.finish();
    return true;
  }

  cancel(): void {
    this.activeBinding = null;
  }
}

export function isPushToTalkShortcutKey(key: string): boolean {
  return key.toLowerCase() === "t";
}
