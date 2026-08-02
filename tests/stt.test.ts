import { describe, expect, it } from "vitest";
import { BrowserSpeechPort } from "../src/input/stt";

interface FakeResult {
  readonly isFinal: boolean;
  readonly 0: { readonly transcript: string };
  readonly length: 1;
}

class FakeRecognition {
  lang = "";
  continuous = true;
  interimResults = false;
  onresult: ((event: { resultIndex: number; results: ArrayLike<FakeResult> }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  startCalls = 0;

  start(): void {
    this.startCalls += 1;
  }

  stop(): void {}

  abort(): void {}

  emitResult(transcript: string, isFinal: boolean): void {
    const result: FakeResult = {
      0: { transcript },
      length: 1,
      isFinal,
    };
    this.onresult?.({ resultIndex: 0, results: { 0: result, length: 1 } });
  }

  emitError(error: string): void {
    this.onerror?.({ error });
  }

  end(): void {
    this.onend?.();
  }
}

describe("M2 Web Speech 어댑터", () => {
  it("SpeechRecognition 미지원 환경을 안전하게 보고한다", async () => {
    const port = new BrowserSpeechPort(null);

    expect(port.isSupported()).toBe(false);
    await expect(port.listen(() => {})).rejects.toMatchObject({
      code: "unsupported",
    });
  });

  it("ko-KR 단발 인식에서 interim을 알리고 final transcript를 반환한다", async () => {
    const recognition = new FakeRecognition();
    const port = new BrowserSpeechPort(() => recognition);
    const interim: string[] = [];

    const listening = port.listen((text) => interim.push(text));
    recognition.emitResult("수당은", false);
    recognition.emitResult("수당은 나와", true);

    await expect(listening).resolves.toBe("수당은 나와");
    expect(interim).toEqual(["수당은"]);
    expect(recognition).toMatchObject({
      lang: "ko-KR",
      continuous: false,
      interimResults: true,
      startCalls: 1,
    });
  });

  it("취소 뒤 도착한 늦은 recognition 콜백을 무시한다", async () => {
    const recognition = new FakeRecognition();
    const port = new BrowserSpeechPort(() => recognition);
    const interim: string[] = [];

    const listening = port.listen((text) => interim.push(text));
    port.cancel();
    recognition.emitResult("이미 지나간 말", false);
    recognition.emitResult("이미 지나간 말", true);

    await expect(listening).rejects.toMatchObject({ code: "aborted" });
    expect(interim).toEqual([]);
  });

  it("final 없이 종료되면 no-speech로 실패한다", async () => {
    const recognition = new FakeRecognition();
    const port = new BrowserSpeechPort(() => recognition);

    const listening = port.listen(() => {});
    recognition.end();

    await expect(listening).rejects.toMatchObject({ code: "no-speech" });
  });

  it("recognition 오류 코드를 호출자에게 보존한다", async () => {
    const recognition = new FakeRecognition();
    const port = new BrowserSpeechPort(() => recognition);

    const listening = port.listen(() => {});
    recognition.emitError("network");

    await expect(listening).rejects.toMatchObject({ code: "network" });
  });
});
