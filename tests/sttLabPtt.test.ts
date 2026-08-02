import { describe, expect, it } from "vitest";
import {
  PushToTalkCapture,
  type RecordingSession,
} from "../src/stt-lab/pushToTalk";

describe("STT Lab push-to-talk", () => {
  it("누르고 있는 동안 유지하고 release 호출에서만 녹음을 종료한다", async () => {
    let finishCount = 0;
    const expected = new Blob(["voice"], { type: "audio/webm" });
    const capture = new PushToTalkCapture(async () => ({
      async finish() {
        finishCount += 1;
        return expected;
      },
      abort() {},
    }));

    await capture.press();

    expect(capture.state).toBe("recording");
    expect(finishCount).toBe(0);

    const recorded = await capture.release();

    expect(recorded).toBe(expected);
    expect(finishCount).toBe(1);
    expect(capture.state).toBe("idle");
  });

  it("마이크 준비 전에 버튼을 떼도 준비 직후 한 번 종료한다", async () => {
    let resolveSession!: (session: RecordingSession) => void;
    const ready = new Promise<RecordingSession>((resolve) => {
      resolveSession = resolve;
    });
    let finishCount = 0;
    const expected = new Blob(["short-voice"], { type: "audio/webm" });
    const capture = new PushToTalkCapture(() => ready);

    const pressing = capture.press();
    const releasing = capture.release();
    resolveSession({
      async finish() {
        finishCount += 1;
        return expected;
      },
      abort() {},
    });

    await pressing;
    await expect(releasing).resolves.toBe(expected);
    expect(finishCount).toBe(1);
    expect(capture.state).toBe("idle");
  });
});
