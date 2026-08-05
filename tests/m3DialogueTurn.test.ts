import { describe, expect, it } from "vitest";
import { afterVoiceAccepted } from "../src/engine/dialogueTurn";

describe("M3 음성 입력 완료 턴 순서", () => {
  it("전사문을 UI에 넘기지 않고 입력 완료 상태 다음에 판정을 시작한다", async () => {
    const events: string[] = [];
    let finishPaint!: () => void;
    const painted = new Promise<void>((resolve) => {
      finishPaint = resolve;
    });

    const turn = afterVoiceAccepted(
      async () => {
        events.push("accepted");
        await painted;
        events.push("painted");
      },
      async () => {
        events.push("judge");
        return "reply";
      },
    );

    await Promise.resolve();
    expect(events).toEqual(["accepted"]);
    finishPaint();

    await expect(turn).resolves.toBe("reply");
    expect(events).toEqual(["accepted", "painted", "judge"]);
  });
});
