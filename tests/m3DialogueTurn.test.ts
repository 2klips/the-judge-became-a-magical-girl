import { describe, expect, it } from "vitest";
import { afterTranscriptVisible } from "../src/engine/dialogueTurn";

describe("M3 transcript-first 턴 순서", () => {
  it("화면 표시 완료 전에는 로컬/LLM 판정을 시작하지 않는다", async () => {
    const events: string[] = [];
    let finishPaint!: () => void;
    const painted = new Promise<void>((resolve) => {
      finishPaint = resolve;
    });

    const turn = afterTranscriptVisible(
      "내 말 먼저 보여 줘",
      async (transcript) => {
        events.push(`render:${transcript}`);
        await painted;
        events.push("painted");
      },
      async () => {
        events.push("judge");
        return "reply";
      },
    );

    await Promise.resolve();
    expect(events).toEqual(["render:내 말 먼저 보여 줘"]);
    finishPaint();

    await expect(turn).resolves.toBe("reply");
    expect(events).toEqual(["render:내 말 먼저 보여 줘", "painted", "judge"]);
  });
});
