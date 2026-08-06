import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BGM_DEFAULT_VOLUME,
  BGM_DUCK_MULTIPLIER,
  BgmController,
  type AudioChannel,
  type AutoplayGestureTarget,
} from "../src/audio/bgm";
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
  it("누락 BGM 로드 실패는 예외 대신 무음으로 계속하고 같은 경로를 재요청하지 않는다", async () => {
    const channel = fakeChannel();
    vi.mocked(channel.play).mockRejectedValueOnce(new Error("BGM 404"));
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const createAudio = vi.fn(() => channel);
    const controller = new BgmController(createAudio, 600, null);

    await expect(controller.play("bgm_daily")).resolves.toBeUndefined();
    await expect(controller.play("bgm_daily")).resolves.toBeUndefined();

    expect(warning).toHaveBeenCalledOnce();
    expect(warning.mock.calls[0]?.[0]).toContain("[ASSET_HANDOFF] bgm_daily");
    expect(createAudio).toHaveBeenCalledOnce();
    expect(channel.pause).toHaveBeenCalledOnce();
  });

  it("BGM을 크로스페이드하고 PTT 청취 중 음량을 낮춘다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel()];
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600, null);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[0]!.loop).toBe(true);
    expect(channels[0]!.volume).toBe(BGM_DEFAULT_VOLUME);

    controller.setDucked(true);
    expect(channels[0]!.volume).toBe(
      BGM_DEFAULT_VOLUME * BGM_DUCK_MULTIPLIER,
    );

    await controller.play("bgm_transform", false);
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[1]!.loop).toBe(false);
    expect(channels[1]!.volume).toBe(
      BGM_DEFAULT_VOLUME * BGM_DUCK_MULTIPLIER,
    );
    expect(channels[0]!.pause).toHaveBeenCalledOnce();

    controller.setDucked(false);
    expect(channels[1]!.volume).toBe(BGM_DEFAULT_VOLUME);
  });

  it("autoplay 거부 시 다음 포인터 입력에서 최신 요청을 한 번 재시도한다", async () => {
    const first = fakeChannel();
    const retry = fakeChannel();
    vi.mocked(first.play).mockRejectedValueOnce(
      new DOMException("gesture required", "NotAllowedError"),
    );
    const channels = [first, retry];
    let channelIndex = 0;
    let pointerdown: (() => void) | null = null;
    const gestureTarget: AutoplayGestureTarget = {
      addEventListener: vi.fn((_type, listener) => {
        pointerdown = listener;
      }),
      removeEventListener: vi.fn(() => {
        pointerdown = null;
      }),
    };
    const firePointerdown = (): void => {
      const listener = pointerdown;
      if (!listener) throw new Error("pointerdown listener가 등록되지 않았습니다.");
      listener();
    };
    const controller = new BgmController(
      () => channels[channelIndex++]!,
      600,
      gestureTarget,
    );

    await controller.play("bgm_daily");
    expect(first.pause).toHaveBeenCalledOnce();
    expect(gestureTarget.addEventListener).toHaveBeenCalledOnce();

    firePointerdown();
    await vi.waitFor(() => expect(retry.play).toHaveBeenCalledOnce());
    expect(retry.loop).toBe(true);
  });

  it("Audio error 이벤트 뒤에도 실패한 BGM 경로를 다시 만들지 않는다", async () => {
    const channel = fakeChannel();
    let onError: (() => void) | null = null;
    vi.mocked(channel.addEventListener).mockImplementation((_type, listener) => {
      onError = listener;
    });
    const createAudio = vi.fn(() => channel);
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controller = new BgmController(createAudio, 600, null);

    await controller.play("bgm_ending");
    const emitError = (): void => {
      const listener = onError;
      if (!listener) throw new Error("audio error listener가 등록되지 않았습니다.");
      listener();
    };
    emitError();
    await controller.play("bgm_ending");

    expect(createAudio).toHaveBeenCalledOnce();
    expect(channel.pause).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledOnce();
  });

  it("같은 one-shot 논리 ID를 결과 재렌더에서 중복 재생하지 않는다", async () => {
    const channel = fakeChannel();
    const createAudio = vi.fn(() => channel);
    const controller = new BgmController(createAudio, 600, null);

    await controller.play("bgm_transform", false);
    await controller.play("bgm_transform", false);

    expect(createAudio).toHaveBeenCalledOnce();
    expect(channel.play).toHaveBeenCalledOnce();
    expect(channel.loop).toBe(false);
  });
});
