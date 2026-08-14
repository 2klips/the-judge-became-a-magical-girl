import { describe, expect, it } from "vitest";
import { resolveDebugVoiceFailure } from "../src/input/voiceFailureInjection";
import {
  clearVoiceFailureAttempts,
  formatVoiceTurnFailureMessage,
  resolveVoiceTurnFailure,
} from "../src/input/voiceTurnRecovery";

describe("음성 실패 복구 정책", () => {
  it("기록 후 total 1인 첫 실패는 같은 턴 음성을 유지한다", () => {
    expect(resolveVoiceTurnFailure(0, 1)).toEqual({
      nextAttemptInTurn: 1,
      forceClickForTurn: false,
      forceGlobalClick: false,
    });
  });

  it("기록 후 total 2인 같은 턴 두 번째 실패는 현재 턴 클릭으로 전환한다", () => {
    expect(resolveVoiceTurnFailure(1, 2)).toEqual({
      nextAttemptInTurn: 0,
      forceClickForTurn: true,
      forceGlobalClick: false,
    });
  });

  it("첫 실패와 두 번째 실패의 안내가 서로 상충하지 않는다", () => {
    const first = formatVoiceTurnFailureMessage("음성 서버에 연결하지 못했어.", "retry");
    const second = formatVoiceTurnFailureMessage("음성 서버에 연결하지 못했어.", "click");

    expect(first).toContain("한 번 더");
    expect(first).not.toContain("클릭");
    expect(second).toContain("이 턴은 클릭");
    expect(second).not.toMatch(/한 번 더|다시 시도/);
  });

  it.each([0, 1])(
    "기록 후 total 5면 같은 턴 attempt %i에서도 즉시 전체 클릭 모드가 된다",
    (attemptInTurn) => {
      expect(resolveVoiceTurnFailure(attemptInTurn, 5)).toEqual({
        nextAttemptInTurn: 0,
        forceClickForTurn: true,
        forceGlobalClick: true,
      });
    },
  );

  it("순수 decision은 누적 기록 책임을 갖지 않는다", () => {
    expect(resolveVoiceTurnFailure(0, 1)).not.toHaveProperty("countInputFailure");
  });

  it("기록 후 total 5를 넘겨도 전체 click을 유지한다", () => {
    expect(resolveVoiceTurnFailure(0, 9)).toMatchObject({
      forceClickForTurn: true,
      forceGlobalClick: true,
    });
  });

  it("voice failure 주입은 debug URL에서만 허용한다", () => {
    expect(resolveDebugVoiceFailure("?voiceFailure=network", false)).toBeNull();
    expect(resolveDebugVoiceFailure("?debug=1&voiceFailure=network", true)).toBe("network");
    expect(resolveDebugVoiceFailure("?debug=1&voiceFailure=unknown", true)).toBeNull();
  });

  it.each(["new-game", "resume", "ending-restart"] as const)(
    "%s 세션 진입은 이전 턴 attempt를 비운다",
    () => {
      const attempts = new Map([["dialogue:n1_first_voice:0", 1]]);
      clearVoiceFailureAttempts(attempts);
      expect(attempts.size).toBe(0);
    },
  );
});
