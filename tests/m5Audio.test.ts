import { afterEach, describe, expect, it, vi } from "vitest";
import { BgmController, type AudioChannel } from "../src/audio/bgm";
import { resetAssetDiagnosticsForTest } from "../src/assets/catalog";

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
  resetAssetDiagnosticsForTest();
  vi.restoreAllMocks();
});

describe("M5 BGM 제어", () => {
  it("누락 BGM 로드 실패는 예외 대신 무음으로 계속한다", async () => {
    const channel = fakeChannel();
    vi.mocked(channel.play).mockRejectedValueOnce(new Error("BGM 404"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controller = new BgmController(() => channel, 600);

    await expect(controller.play("bgm_daily")).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledOnce();
    expect(warning.mock.calls[0]?.[0]).toContain("[ASSET_HANDOFF] bgm_daily");
  });

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
