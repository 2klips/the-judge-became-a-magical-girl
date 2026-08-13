import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BGM_DEFAULT_VOLUME,
  BGM_DUCK_MULTIPLIER,
  BGM_PREFERENCES_STORAGE_KEY,
  BgmController,
  loadBgmPreferences,
  saveBgmPreferences,
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
  it("신규·손상 설정은 20%를 사용하고 유효한 기존 설정은 보존한다", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    expect(BGM_DEFAULT_VOLUME).toBe(0.2);
    expect(loadBgmPreferences(storage)).toEqual({ volume: 0.2, muted: false });

    saveBgmPreferences(storage, { volume: 0.37, muted: true });
    expect(loadBgmPreferences(storage)).toEqual({ volume: 0.37, muted: true });

    values.set(BGM_PREFERENCES_STORAGE_KEY, "{broken");
    expect(loadBgmPreferences(storage)).toEqual({ volume: 0.2, muted: false });
  });

  it("fade 도중 새 cue가 오면 이전 두 채널을 모두 정리하고 최신 채널만 남긴다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel(), fakeChannel()];
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600, null);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(300);
    await controller.play("bgm_crisis");
    await vi.advanceTimersByTimeAsync(300);
    await controller.play("bgm_battle");

    expect(channels[0]!.pause).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[1]!.pause).toHaveBeenCalledOnce();
    expect(channels[2]!.pause).not.toHaveBeenCalled();
    expect(channels[2]!.volume).toBe(0.2);
  });

  it("서로 다른 cue는 앞 곡을 먼저 닫은 뒤 다음 곡을 연다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel()];
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600, null);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(600);
    await controller.play("bgm_crisis");
    await vi.advanceTimersByTimeAsync(300);

    expect(channels[0]!.pause).toHaveBeenCalledOnce();
    expect(channels[1]!.volume).toBe(0);

    await vi.advanceTimersByTimeAsync(300);
    expect(channels[1]!.volume).toBe(0.2);
  });

  it("play 완료 전에 error가 발생한 채널은 완료 뒤에도 현재 채널이 되지 않는다", async () => {
    vi.useFakeTimers();
    const channel = fakeChannel();
    let finishPlay!: () => void;
    let onError: (() => void) | null = null;
    vi.mocked(channel.play).mockImplementation(
      () => new Promise<void>((resolve) => {
        finishPlay = resolve;
      }),
    );
    vi.mocked(channel.addEventListener).mockImplementation((_type, listener) => {
      onError = listener;
    });
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const controller = new BgmController(() => channel, 600, null);

    const playback = controller.play("bgm_daily");
    const emitError = (): void => {
      const listener = onError;
      if (!listener) throw new Error("audio error listener가 등록되지 않았습니다.");
      listener();
    };
    emitError();
    finishPlay();
    await playback;
    await vi.advanceTimersByTimeAsync(600);

    expect(channel.pause).toHaveBeenCalledOnce();
    expect(channel.volume).toBe(0);
  });

  it("동시 play 완료 순서가 뒤집혀도 가장 최근 cue만 유지한다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel()];
    const finishPlay: Array<() => void> = [];
    for (const channel of channels) {
      vi.mocked(channel.play).mockImplementation(
        () => new Promise<void>((resolve) => finishPlay.push(resolve)),
      );
    }
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600, null);

    const dailyPlayback = controller.play("bgm_daily");
    const crisisPlayback = controller.play("bgm_crisis");
    finishPlay[1]!();
    await crisisPlayback;
    await vi.advanceTimersByTimeAsync(600);
    finishPlay[0]!();
    await dailyPlayback;
    await vi.advanceTimersByTimeAsync(600);

    expect(channels[0]!.pause).toHaveBeenCalledOnce();
    expect(channels[1]!.pause).not.toHaveBeenCalled();
    expect(channels[1]!.volume).toBe(0.2);
  });

  it("현재 채널 error는 진행 중 fade를 즉시 취소한다", async () => {
    vi.useFakeTimers();
    const channels = [fakeChannel(), fakeChannel()];
    const onError: Array<() => void> = [];
    for (const channel of channels) {
      vi.mocked(channel.addEventListener).mockImplementation((_type, listener) => {
        onError.push(listener);
      });
    }
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    let index = 0;
    const controller = new BgmController(() => channels[index++]!, 600, null);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(600);
    await controller.play("bgm_crisis");
    await vi.advanceTimersByTimeAsync(100);
    const volumeAtError = channels[1]!.volume;
    onError[1]!();

    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(600);
    expect(channels[1]!.volume).toBe(volumeAtError);
    expect(channels[0]!.pause).toHaveBeenCalledOnce();
    expect(channels[1]!.pause).toHaveBeenCalledOnce();
  });

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

  it("사용자 볼륨·음소거를 현재 채널과 PTT duck에 함께 적용한다", async () => {
    vi.useFakeTimers();
    const channel = fakeChannel();
    const controller = new BgmController(() => channel, 600, null);

    await controller.play("bgm_daily");
    await vi.advanceTimersByTimeAsync(600);
    controller.setVolume(0.4);
    expect(channel.volume).toBe(0.4);

    controller.setDucked(true);
    expect(channel.volume).toBe(0.4 * BGM_DUCK_MULTIPLIER);

    controller.setMuted(true);
    expect(channel.volume).toBe(0);
    expect(controller.isMuted()).toBe(true);

    controller.setMuted(false);
    expect(channel.volume).toBe(0.4 * BGM_DUCK_MULTIPLIER);
  });

  it("BGM 설정을 안전하게 저장·복구하고 손상값은 기본값으로 강등한다", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    saveBgmPreferences(storage, { volume: 0.37, muted: true });
    expect(loadBgmPreferences(storage)).toEqual({ volume: 0.37, muted: true });

    values.set(BGM_PREFERENCES_STORAGE_KEY, "{broken");
    expect(loadBgmPreferences(storage)).toEqual({
      volume: BGM_DEFAULT_VOLUME,
      muted: false,
    });
  });
});
