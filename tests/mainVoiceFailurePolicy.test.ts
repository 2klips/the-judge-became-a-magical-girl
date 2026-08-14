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

describe("main 실제 음성 입력 실패 누적 정책", () => {
  it("공통 handler가 첫 실패부터 엔진 누적값을 올린다", () => {
    const handler = sourceSection("const handleVoiceFailure", "const handleTypedVoiceFailure");
    const recordIndex = handler.indexOf("engine.recordSttTurnFailure()");
    const retryIndex = handler.indexOf("formatVoiceTurnFailureMessage(message, \"retry\")");

    expect(handler).toContain("decision.countInputFailure");
    expect(handler.match(/engine\.recordSttTurnFailure\(\)/g)).toHaveLength(1);
    expect(recordIndex).toBeGreaterThanOrEqual(0);
    expect(retryIndex).toBeGreaterThanOrEqual(0);
    expect(recordIndex).toBeLessThan(retryIndex);
  });

  it("전체 5회 전환을 같은 턴 재시도보다 먼저 처리한다", () => {
    const handler = sourceSection("const handleVoiceFailure", "const handleTypedVoiceFailure");
    const globalClickIndex = handler.indexOf("decision.forceGlobalClick");
    const retryIndex = handler.indexOf("formatVoiceTurnFailureMessage(message, \"retry\")");

    expect(globalClickIndex).toBeGreaterThanOrEqual(0);
    expect(retryIndex).toBeGreaterThanOrEqual(0);
    expect(globalClickIndex).toBeLessThan(retryIndex);
    expect(handler).toContain("음성 입력 실패가 5회 누적돼 클릭 모드로 전환했어.");
  });

  it("지원 여부 판정을 포함한 typed 실패 결정도 공통 handler에 전달한다", () => {
    const typedHandler = sourceSection(
      "const handleTypedVoiceFailure",
      "const pendingDebugVoiceFailure",
    );

    expect(typedHandler).toContain("resolveUnavailableVoiceFailure(");
    expect(typedHandler).toMatch(/handleVoiceFailure\(turnKey, baseMessage, decision\)/);
    expect(typedHandler).not.toContain("engine.recordSttTurnFailure");
  });

  it("누적값 변경은 typed 실패 공통 handler 한 곳에만 둔다", () => {
    const handler = sourceSection("const handleVoiceFailure", "const handleTypedVoiceFailure");

    expect(mainSource.match(/engine\.recordSttTurnFailure\(\)/g)).toHaveLength(1);
    expect(handler).toContain("engine.recordSttTurnFailure()");
  });

});
