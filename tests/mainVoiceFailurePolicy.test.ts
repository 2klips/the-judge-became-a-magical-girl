import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { VoiceFailureKind } from "../src/input/transcription";
import { recordTypedVoiceFailure } from "../src/input/voiceTurnRecovery";

const actualFailureKinds: readonly VoiceFailureKind[] = [
  "permission",
  "recording",
  "no-speech",
  "timeout",
  "http",
  "schema",
  "network",
];
const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");
const typedFailureCalls =
  /handleTypedVoiceFailure|recordTypedVoiceFailure|recordSttTurnFailure/;

function boundedSection(source: string, start: string, end: string): string {
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  expect(startIndex, start).toBeGreaterThanOrEqual(0);
  expect(endIndex, end).toBeGreaterThan(startIndex);
  return source.slice(startIndex, endIndex);
}

describe("실제 typed 음성 입력 실패 기록", () => {
  it.each(actualFailureKinds)("지원 환경의 %s 실패를 먼저 한 번 기록한다", (kind) => {
    const recordFailure = vi.fn(() => ({ state: { sttFailCount: 1 } }));

    const decision = recordTypedVoiceFailure(kind, true, 0, recordFailure);

    expect(recordFailure).toHaveBeenCalledTimes(1);
    expect(decision).toEqual({
      failureKind: kind,
      capabilityUnavailable: false,
      nextAttemptInTurn: 1,
      forceClickForTurn: false,
      forceGlobalClick: false,
    });
  });

  it.each(actualFailureKinds)("미지원 환경의 %s 실패는 기록하지 않고 즉시 global click이다", (kind) => {
    const recordFailure = vi.fn(() => ({ state: { sttFailCount: 99 } }));

    const decision = recordTypedVoiceFailure(kind, false, 0, recordFailure);

    expect(recordFailure).not.toHaveBeenCalled();
    expect(decision).toEqual({
      failureKind: kind,
      capabilityUnavailable: true,
      nextAttemptInTurn: 0,
      forceClickForTurn: true,
      forceGlobalClick: true,
    });
  });
});

describe("main 음성 실패 포함·제외 경계", () => {
  it("typed failure adapter가 실제 엔진 기록 callback을 정확히 한 번 연결한다", () => {
    const adapter = boundedSection(
      mainSource,
      "const handleTypedVoiceFailure",
      "const pendingDebugVoiceFailure",
    );

    expect(adapter.match(/recordTypedVoiceFailure\(/g)).toHaveLength(1);
    expect(adapter.match(/\(\) => engine\.recordSttTurnFailure\(\)/g)).toHaveLength(1);
  });

  it("capture cancellation은 typed 실패를 기록하지 않는다", () => {
    const cancellation = boundedSection(
      mainSource,
      "const voiceCapture",
      "const createVoiceTurn",
    );

    expect(cancellation).toContain("cancel: (): void =>");
    expect(cancellation).not.toMatch(typedFailureCalls);
  });

  it.each([
    ["incantation", "const renderIncantationNode", "const renderBattleNode", "\n        },"],
    ["battle", "const renderBattleNode", "renderCurrent =", "\n        },"],
    [
      "dialogue",
      "view.renderDialogue(node",
      'if (node.type === "cutscene")',
      "\n          },",
    ],
  ] as const)(
    "%s manual click switch는 typed 실패를 기록하지 않는다",
    (_, start, end, modeEnd) => {
      const surface = boundedSection(mainSource, start, end);
      const modeSwitch = boundedSection(
        surface,
        "onModeChange: (inputMode) => {",
        modeEnd,
      );

      expect(modeSwitch).toContain("engine.setInputMode(inputMode)");
      expect(modeSwitch).not.toMatch(typedFailureCalls);
    },
  );

  it("dialogue LLM fallback은 typed 실패를 기록하지 않는다", () => {
    const fallback = boundedSection(mainSource, "const applyFallback", "view.renderDialogue(node");

    expect(fallback).toMatch(/recordLlmFailure|submitFallbackJudgement/);
    expect(fallback).not.toMatch(typedFailureCalls);
  });

  it("battle LLM fallback은 typed 실패를 기록하지 않는다", () => {
    const battle = boundedSection(mainSource, "const renderBattleNode", "renderCurrent =");
    const fallback = boundedSection(
      battle,
      "const request = new AbortController();",
      "\n      };\n\n      view.renderBattle(",
    );

    expect(fallback).toMatch(/recordLlmFailure|judgeBattleWithFailureGate/);
    expect(fallback).not.toMatch(typedFailureCalls);
  });

  it("battle dBFS retry와 consume 경로는 typed 실패를 기록하지 않는다", () => {
    const battle = boundedSection(mainSource, "const renderBattleNode", "renderCurrent =");
    const levelGate = boundedSection(
      battle,
      "if (audioLevel && microphoneCalibration)",
      "battleVolumeFailures.delete(`${phase.phaseId}:${battleState.phaseTurn}`)",
    );

    expect(levelGate).toContain('resolveVoiceLevelFailure(priorFailureCount) === "retry"');
    expect(levelGate).toContain('kind: "failed-spell"');
    expect(levelGate).not.toMatch(typedFailureCalls);
  });
});
