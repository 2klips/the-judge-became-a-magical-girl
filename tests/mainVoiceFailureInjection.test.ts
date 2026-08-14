import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  consumeDebugVoiceFailure,
  createPendingDebugVoiceFailure,
} from "../src/input/voiceFailureInjection";

const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

function sourceSection(start: string, end: string): string {
  const startIndex = mainSource.indexOf(start);
  const endIndex = mainSource.indexOf(end, startIndex + start.length);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return mainSource.slice(startIndex, endIndex);
}

describe("main debug 음성 실패 주입 wiring", () => {
  it.each([
    "permission",
    "recording",
    "no-speech",
    "timeout",
    "http",
    "schema",
    "network",
  ] as const)("DEV %s 주입을 실제 typed failure로 소비한다", (kind) => {
    const pending = createPendingDebugVoiceFailure(
      `?debug=1&voiceFailure=${kind}`,
      true,
      true,
    );

    expect(consumeDebugVoiceFailure(pending)).toMatchObject({ kind });
  });

  it("DEV와 debug가 모두 켜진 bootstrap에서 pending holder를 한 번 만든다", () => {
    expect(mainSource).toContain("consumeDebugVoiceFailure");
    expect(mainSource).toContain("createPendingDebugVoiceFailure");
    expect(mainSource.match(/createPendingDebugVoiceFailure\(/g)).toHaveLength(1);
    expect(mainSource).toMatch(
      /createPendingDebugVoiceFailure\(\s*window\.location\.search,\s*debugEnabled,\s*import\.meta\.env\.DEV,\s*\)/,
    );
  });

  it("주입기는 typed adapter만 호출하고 mode나 game action을 직접 바꾸지 않는다", () => {
    const adapter = sourceSection(
      "const consumeInjectedVoiceFailure",
      "const voiceCapture",
    );

    expect(adapter).toContain("consumeDebugVoiceFailure(pendingDebugVoiceFailure)");
    expect(adapter).toContain("handleTypedVoiceFailure(turnKey, failure)");
    expect(adapter).not.toMatch(/engine\.setInputMode|engine\.(?:choose|submit|advance|start|resume)/);
  });

  it("공통 capture는 stable turn key를 받고 실제 capture 전에 정확히 한 항목을 소비한다", () => {
    const capture = sourceSection("const voiceCapture", "const createVoiceTurn");

    expect(capture).toMatch(
      /const voiceCapture = \(\s*voice: RecordedVoiceTurnController,\s*turnKey: string,?\s*\)/,
    );
    expect(capture).toMatch(
      /startCapture: async \(\): Promise<void> => \{\s*if \(consumeInjectedVoiceFailure\(turnKey\)\) return;\s*bgm\.setDucked\(true\)/,
    );
  });

  it("dialogue, incantation, battle의 실제 공통 capture 호출이 stable key를 넘긴다", () => {
    expect(mainSource).toContain("voiceCapture(voice, dialogueTurnKey)");
    expect(mainSource).toContain("voiceCapture(voice, incantationTurnKey)");
    expect(mainSource).toContain("voiceCapture(voice, battleTurnKey)");
    expect(mainSource).not.toMatch(/\.\.\.voiceCapture\(voice\)(?!,)/);
  });
});
