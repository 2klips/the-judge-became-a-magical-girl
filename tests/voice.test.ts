import { describe, expect, it } from "vitest";
import { SpeechInputError, type SpeechPort } from "../src/input/stt";
import { VoiceTurnController } from "../src/input/voice";

class FakeSpeechPort implements SpeechPort {
  private readonly results: Array<Promise<string>> = [];

  queueResult(result: Promise<string>): void {
    this.results.push(result);
  }

  queueError(code: string): void {
    this.queueResult(Promise.reject(new SpeechInputError(code)));
  }

  isSupported(): boolean {
    return true;
  }

  listen(): Promise<string> {
    const result = this.results.shift();
    if (!result) {
      throw new Error("예약된 SpeechPort 결과가 없습니다.");
    }
    return result;
  }

  stop(): void {}

  cancel(): void {}
}

describe("M2 음성 턴 제어", () => {
  it("같은 턴 첫 실패는 재시도, 두 번째 실패는 클릭 폴백을 요청한다", async () => {
    const speech = new FakeSpeechPort();
    speech.queueError("no-speech");
    speech.queueError("network");
    const controller = new VoiceTurnController(speech);

    await expect(controller.capture(() => {})).resolves.toMatchObject({
      kind: "retry",
      attempt: 1,
    });
    await expect(controller.capture(() => {})).resolves.toMatchObject({
      kind: "fallback",
      attempt: 2,
    });
  });

  it("권한 거부는 재요청하지 않고 즉시 클릭 전환을 요청한다", async () => {
    const speech = new FakeSpeechPort();
    speech.queueError("not-allowed");
    const controller = new VoiceTurnController(speech);

    await expect(controller.capture(() => {})).resolves.toMatchObject({
      kind: "unavailable",
      error: { code: "not-allowed" },
    });
  });

  it("취소된 요청의 늦은 transcript를 무시한다", async () => {
    const speech = new FakeSpeechPort();
    let resolveTranscript: (transcript: string) => void = () => {};
    speech.queueResult(
      new Promise<string>((resolve) => {
        resolveTranscript = resolve;
      }),
    );
    const controller = new VoiceTurnController(speech);

    const capture = controller.capture(() => {});
    controller.cancel();
    resolveTranscript("늦게 도착한 말");

    await expect(capture).resolves.toEqual({ kind: "cancelled" });
  });
});
