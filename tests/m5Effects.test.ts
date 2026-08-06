import { describe, expect, it } from "vitest";
import { applySceneEffect } from "../src/ui/effects";

describe("M5 장면 effect 수명", () => {
  it("effect class를 자기 animationend 뒤 제거한다", () => {
    const classes = new Set<string>();
    let listener: ((event: AnimationEvent) => void) | null = null;
    const shell = {
      classList: {
        add: (className: string) => classes.add(className),
        remove: (className: string) => classes.delete(className),
      },
      addEventListener: (_type: string, next: (event: AnimationEvent) => void) => {
        listener = next;
      },
      removeEventListener: () => {
        listener = null;
      },
    } as unknown as HTMLElement;

    applySceneEffect(shell, "fade");
    expect(classes.has("effect-fade")).toBe(true);
    const activeListener = listener as ((event: AnimationEvent) => void) | null;
    expect(activeListener).not.toBeNull();
    activeListener?.({ target: shell } as unknown as AnimationEvent);
    expect(classes.has("effect-fade")).toBe(false);
  });

  it("none은 class와 listener를 만들지 않는다", () => {
    let touched = false;
    const shell = {
      classList: { add: () => { touched = true; } },
      addEventListener: () => { touched = true; },
    } as unknown as HTMLElement;
    applySceneEffect(shell, "none");
    expect(touched).toBe(false);
  });
});
