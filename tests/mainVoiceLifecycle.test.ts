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
      mainSource.indexOf("onNewGame: (mode, calibration) =>"),
      mainSource.indexOf("onResume: (mode, calibration) =>"),
    );
    expect(section).toContain("microphoneCalibration = calibration;");
    expect(section).not.toContain("if (calibration)");
    expectResetBeforeTransition(section, /engine\.startNewGame\(/);
  });

  it("title Resume은 start/resume 분기 전에 음성 실패 session을 비운다", () => {
    const section = mainSource.slice(
      mainSource.indexOf("onResume: (mode, calibration) =>"),
      mainSource.indexOf("});", mainSource.indexOf("onResume: (mode, calibration) =>")),
    );
    expect(section).toContain("microphoneCalibration = calibration;");
    expect(section).not.toContain("if (calibration)");
    expectResetBeforeTransition(section, /engine\.(?:startNewGame|resume)\(/);
  });

  it("TITLE은 저장 원본을 쓰지 않고 session mode copy로 resume한다", () => {
    const start = mainSource.indexOf("view.renderTitle({");
    const end = mainSource.indexOf("});", start);
    const section = mainSource.slice(start, end);
    expect(section).toContain("savedInputMode: loaded.state?.inputMode ?? null");
    expect(section).toContain("engine.resume(withTitleResumeMode(loaded.state, mode))");
    expect(section).not.toContain("engine.setInputMode");
  });

  it("TITLE 첫 gesture만 bgm_daily를 요청하고 load 시점에는 요청하지 않는다", () => {
    const titleStart = mainSource.indexOf("view.renderTitle({");
    const section = mainSource.slice(titleStart, mainSource.indexOf("});", titleStart));
    expect(section).toContain("onFirstUserGesture");
    expect(section).toContain('bgm.play("bgm_daily")');
    expect(mainSource.slice(0, titleStart)).not.toContain('bgm.play("bgm_daily")');
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
