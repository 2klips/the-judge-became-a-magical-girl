import { afterEach, describe, expect, it, vi } from "vitest";
import { BgmController, type AudioChannel } from "../src/audio/bgm";

function fakeChannel(): AudioChannel {
  return {
    src: "",
    loop: false,
    volume: 1,
    currentTime: 0,
    play: vi.fn(async () => undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
  };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("M5 BGM 제어", () => {
  it("BGM을 크로스페이드하고 PTT 청취 중 음량을 낮춘다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel()];
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[0]!.loop).toBe(true);
    expect(channels[0]!.volume).toBe(1);

    controller.setDucked(true);
    expect(channels[0]!.volume).toBe(0.18);

    await controller.play("bgm_transform", false);
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[1]!.loop).toBe(false);
    expect(channels[1]!.volume).toBe(0.18);
    expect(channels[0]!.pause).toHaveBeenCalledOnce();

    controller.setDucked(false);
    expect(channels[1]!.volume).toBe(1);
  });
});
