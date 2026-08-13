import { describe, expect, it, vi } from "vitest";
import { enterGameFromTitle } from "../src/ui/titleStart";

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
