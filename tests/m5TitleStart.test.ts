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
});
