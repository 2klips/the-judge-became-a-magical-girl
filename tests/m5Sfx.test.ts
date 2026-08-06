import { describe, expect, it, vi } from "vitest";
import { SfxPlayer } from "../src/audio/sfx";

function fakeAudioContext() {
  const starts: number[] = [];
  const context = {
    currentTime: 1,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    createOscillator: () => ({
      type: "sine" as OscillatorType,
      frequency: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: (time: number) => starts.push(time),
      stop: vi.fn(),
    }),
    createGain: () => ({
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }),
  } as unknown as AudioContext;
  return { context, starts };
}

describe("M5 Web Audio SFX", () => {
  it("같은 cue 40ms 이내 중복을 막고 이후 다층 tone을 재생한다", () => {
    const { context, starts } = fakeAudioContext();
    let now = 100;
    const player = new SfxPlayer(() => context, () => now);

    expect(player.play("advance")).toBe(true);
    expect(player.play("advance")).toBe(false);
    now += 40;
    expect(player.play("advance")).toBe(true);
    expect(starts).toHaveLength(4);
  });

  it("PTT 억제 중에는 context를 만들지 않고 release 뒤 재생한다", () => {
    const { context } = fakeAudioContext();
    const factory = vi.fn(() => context);
    const player = new SfxPlayer(factory, () => 100);
    player.setSuppressed(true);
    expect(player.play("guard")).toBe(false);
    expect(factory).not.toHaveBeenCalled();

    player.setSuppressed(false);
    expect(player.play("guard")).toBe(true);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it("AudioContext 생성 실패는 예외 없이 무음 처리한다", () => {
    const player = new SfxPlayer(() => {
      throw new Error("blocked");
    });
    expect(player.play("ending")).toBe(false);
  });
});
