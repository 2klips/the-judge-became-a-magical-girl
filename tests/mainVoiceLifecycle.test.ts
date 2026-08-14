import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mainSource = readFileSync(new URL("../src/main.ts", import.meta.url), "utf8");

function expectResetBeforeTransition(section: string, transition: RegExp): void {
  const resetIndex = section.indexOf("resetVoiceFailureSession();");
  const transitionMatch = transition.exec(section);
  expect(resetIndex).toBeGreaterThanOrEqual(0);
  expect(transitionMatch).not.toBeNull();
  expect(resetIndex).toBeLessThan(transitionMatch?.index ?? -1);
}

describe("음성 실패 lifecycle", () => {
  it("shared session reset helper가 transient per-turn attempt만 비운다", () => {
    expect(mainSource).toMatch(
      /const resetVoiceFailureSession = \(\): void => \{\s*clearVoiceFailureAttempts\(voiceFailureAttempts\);\s*\};/,
    );
    const section = mainSource.slice(
      mainSource.indexOf("const resetVoiceFailureSession"),
      mainSource.indexOf("const handleVoiceFailure"),
    );
    expect(section).not.toMatch(/recordSttTurnFailure|sttFailCount|setInputMode/);
  });

  it("title New Game은 engine 시작 전에 음성 실패 session을 비운다", () => {
    const section = mainSource.slice(
      mainSource.indexOf("onNewGame: (calibration) =>"),
      mainSource.indexOf("onResume: (calibration) =>"),
    );
    expectResetBeforeTransition(section, /engine\.startNewGame\(/);
  });

  it("title Resume은 start/resume 분기 전에 음성 실패 session을 비운다", () => {
    const section = mainSource.slice(
      mainSource.indexOf("onResume: (calibration) =>"),
      mainSource.indexOf("});", mainSource.indexOf("onResume: (calibration) =>")),
    );
    expectResetBeforeTransition(section, /engine\.(?:startNewGame|resume)\(/);
  });

  it("ending restart는 새 게임 시작 전에 음성 실패 session을 비운다", () => {
    const section = mainSource.slice(
      mainSource.indexOf("view.renderEnding("),
      mainSource.indexOf("view.renderTitle({"),
    );
    expectResetBeforeTransition(section, /engine\.startNewGame\(/);
  });

  it("render마다 현재 node/phase와 다른 transient attempt를 정리한다", () => {
    const section = mainSource.slice(
      mainSource.indexOf("for (const turnKey of voiceFailureAttempts.keys())"),
      mainSource.indexOf("if (node.scene.bgm)"),
    );

    expect(section).toContain("turnKey !== currentVoiceTurnKey");
    expect(section).toContain("voiceFailureAttempts.delete(turnKey)");
  });
});
