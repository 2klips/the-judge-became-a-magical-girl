import { describe, expect, it, vi } from "vitest";
import {
  DIALOGUE_ADVANCE_DELAY_MS,
  DelayedActionGate,
} from "../src/ui/advanceGate";

describe("대화 진행 2초 잠금", () => {
  it("2초 전에는 진행하지 않고 이후 한 번만 진행한다", async () => {
    vi.useFakeTimers();
    try {
      const readyStates: boolean[] = [];
      const action = vi.fn();
      const gate = new DelayedActionGate({
        delayMs: DIALOGUE_ADVANCE_DELAY_MS,
        onReadyChange: (ready) => readyStates.push(ready),
        onAction: action,
      });

      gate.arm();
      expect(gate.trigger()).toBe(false);
      await vi.advanceTimersByTimeAsync(DIALOGUE_ADVANCE_DELAY_MS - 1);
      expect(gate.trigger()).toBe(false);
      await vi.advanceTimersByTimeAsync(1);
      expect(gate.trigger()).toBe(true);
      expect(gate.trigger()).toBe(false);
      expect(action).toHaveBeenCalledTimes(1);
      expect(readyStates).toEqual([false, true]);
    } finally {
      vi.useRealTimers();
    }
  });
});
