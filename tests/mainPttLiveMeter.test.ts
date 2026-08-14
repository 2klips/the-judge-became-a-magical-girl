import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

function sourceSection(start: string, end: string): string {
  const startIndex = mainSource.indexOf(start);
  const endIndex = mainSource.indexOf(end, startIndex + start.length);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return mainSource.slice(startIndex, endIndex);
}

describe("main PTT live meter wiring", () => {
  it("공통 capture가 level observer를 controller에 전달한다", () => {
    const capture = sourceSection("const voiceCapture", "const createVoiceTurn");

    expect(capture).toMatch(
      /startCapture:\s*async \(onLevel: LiveAudioLevelObserver\): Promise<void>/,
    );
    expect(capture).toContain("await voice.press(onLevel)");
    expect(capture).toMatch(
      /if \(consumeInjectedVoiceFailure\(turnKey\)\) return;\s*bgm\.setDucked\(true\);\s*sfx\.setSuppressed\(true\)/,
    );
  });

  it("선택 장치의 단일 recording stream에 observer를 연결한다", () => {
    const factory = sourceSection("const createVoiceTurn", "const showTransformationResult");

    expect(factory).toContain(
      "(onLevel) => beginBrowserRecording(inputDeviceId, onLevel)",
    );
    expect(factory).not.toMatch(/getUserMedia|new BrowserMicrophoneTester/);
  });

  it("meter forwarding은 기존 BGM duck·SFX suppression 복구 경로를 바꾸지 않는다", () => {
    const capture = sourceSection("const voiceCapture", "const createVoiceTurn");

    expect(capture.match(/bgm\.setDucked\(true\)/g)).toHaveLength(1);
    expect(capture.match(/sfx\.setSuppressed\(true\)/g)).toHaveLength(1);
    expect(capture.match(/bgm\.setDucked\(false\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(capture.match(/sfx\.setSuppressed\(false\)/g)?.length).toBeGreaterThanOrEqual(3);
  });
});
