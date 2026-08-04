import { describe, expect, it, vi } from "vitest";
import { PushToTalkShortcutController } from "../src/input/keyboardPtt";

describe("T 키 PTT", () => {
  it("T를 누르는 동안 한 번 시작하고 놓을 때 한 번 종료한다", () => {
    const begin = vi.fn();
    const finish = vi.fn();
    const controller = new PushToTalkShortcutController();

    expect(controller.keyDown("t", false, { begin, finish })).toBe(true);
    expect(controller.keyDown("t", true, { begin, finish })).toBe(false);
    expect(controller.keyDown("t", false, { begin, finish })).toBe(false);
    expect(begin).toHaveBeenCalledTimes(1);

    expect(controller.keyUp("T")).toBe(true);
    expect(controller.keyUp("t")).toBe(false);
    expect(finish).toHaveBeenCalledTimes(1);
  });

  it("다른 키는 PTT를 시작하거나 끝내지 않는다", () => {
    const begin = vi.fn();
    const finish = vi.fn();
    const controller = new PushToTalkShortcutController();

    expect(controller.keyDown("Enter", false, { begin, finish })).toBe(false);
    expect(controller.keyUp("Enter")).toBe(false);
    expect(begin).not.toHaveBeenCalled();
    expect(finish).not.toHaveBeenCalled();
  });
});
