import { describe, expect, it, vi } from "vitest";
import {
  enterGameFromTitle,
  installFirstTitleGesture,
  resolveTitleResume,
  resolveTitleStart,
  withTitleResumeMode,
} from "../src/ui/titleStart";
import type { GameState } from "../src/state";

describe("타이틀 시작 입력", () => {
  it("게임 진입을 동기 호출한 뒤 마이크 연결을 비동기로 정리한다", async () => {
    const order: string[] = [];
    let finishDisconnect!: () => void;
    const disconnect = vi.fn(
      () => new Promise<void>((resolve) => {
        finishDisconnect = () => {
          order.push("disconnect");
          resolve();
        };
      }),
    );

    enterGameFromTitle(() => order.push("enter"), disconnect);

    expect(order).toEqual(["enter"]);
    finishDisconnect();
    await vi.waitFor(() => expect(order).toEqual(["enter", "disconnect"]));
  });

  it("마이크 정리 실패에도 게임에 즉시 진입하고 거부를 소비한다", async () => {
    const order: string[] = [];
    const unhandledRejection = vi.fn();
    process.on("unhandledRejection", unhandledRejection);

    try {
      enterGameFromTitle(
        () => order.push("enter"),
        () => Promise.reject(new Error("disconnect failed")),
      );

      expect(order).toEqual(["enter"]);
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(unhandledRejection).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandledRejection);
    }
  });
});

describe("TITLE activation policy", () => {
  it("UNKNOWN은 선택을 열고 voice-capable은 곧바로 voice를 시작한다", () => {
    expect(resolveTitleStart("UNKNOWN")).toEqual({ kind: "offer-start-modes" });
    expect(resolveTitleStart("READY")).toEqual({ kind: "start", mode: "voice" });
    expect(resolveTitleStart("TEST_SUCCESS")).toEqual({ kind: "start", mode: "voice" });
  });

  it.each(["REQUESTING_PERMISSION", "DENIED", "NO_DEVICE", "UNSUPPORTED", "ERROR"] as const)(
    "%s 상태에서도 click 시작을 허용한다",
    (state) => expect(resolveTitleStart(state)).toEqual({ kind: "start", mode: "click" }),
  );

  it("save와 mic capability에 따라 이어하기를 결정한다", () => {
    expect(resolveTitleResume(false, null, "UNKNOWN")).toEqual({ kind: "blocked-no-save" });
    expect(resolveTitleResume(true, "click", "UNKNOWN")).toEqual({ kind: "resume", mode: "click" });
    expect(resolveTitleResume(true, "voice", "READY")).toEqual({ kind: "resume", mode: "voice" });
    expect(resolveTitleResume(true, "voice", "TEST_SUCCESS")).toEqual({ kind: "resume", mode: "voice" });
    expect(resolveTitleResume(true, "voice", "DENIED")).toEqual({ kind: "offer-voice-resume-modes" });
  });

  it("click resume copy는 inputMode만 바꾸고 원본을 보존한다", () => {
    const state: GameState = {
      affinity: 57,
      npcEmotion: "happy",
      flags: new Set(["perfect_transform"]),
      playerForm: "magical",
      battleGrade: "A",
      nodeTurn: 2,
      totalTurn: 9,
      currentNodeId: "n4_team",
      history: ["n0_review", "n4_team"],
      inputMode: "voice",
      sttFailCount: 4,
      llmFailCount: 1,
    };
    const copy = withTitleResumeMode(state, "click");
    expect(copy).toEqual({ ...state, inputMode: "click" });
    expect(copy).not.toBe(state);
    expect(state.inputMode).toBe("voice");
  });

  it("Tab은 무시하고 첫 pointer/Enter/Space gesture에서 BGM을 한 번만 요청한다", () => {
    const listeners = new Map<string, Set<(event: { key?: string }) => void>>();
    const target = {
      addEventListener: (type: string, listener: (event: { key?: string }) => void) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener: (type: string, listener: (event: { key?: string }) => void) => {
        listeners.get(type)?.delete(listener);
      },
    };
    const play = vi.fn();
    const cleanup = installFirstTitleGesture(target, play);
    expect(play).not.toHaveBeenCalled();
    for (const listener of [...(listeners.get("keydown") ?? [])]) listener({ key: "Tab" });
    expect(play).not.toHaveBeenCalled();
    expect(listeners.get("keydown")?.size).toBe(1);
    for (const listener of [...(listeners.get("keydown") ?? [])]) listener({ key: "Enter" });
    for (const listener of [...(listeners.get("pointerdown") ?? [])]) listener({});
    expect(play).toHaveBeenCalledTimes(1);
    expect(listeners.get("keydown")?.size ?? 0).toBe(0);
    expect(listeners.get("pointerdown")?.size ?? 0).toBe(0);
    cleanup();
  });
});
