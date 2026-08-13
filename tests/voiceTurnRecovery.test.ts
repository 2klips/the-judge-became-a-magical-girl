import { describe, expect, it } from "vitest";
import { resolveDebugVoiceFailure } from "../src/input/voiceFailureInjection";
import {
  clearVoiceFailureAttempts,
  formatVoiceTurnFailureMessage,
  resolveUnavailableVoiceFailure,
  resolveVoiceTurnFailure,
} from "../src/input/voiceTurnRecovery";

describe("음성 실패 복구 정책", () => {
  it("첫 실패는 같은 턴 음성을 유지하고 누적 실패를 올리지 않는다", () => {
    expect(resolveVoiceTurnFailure(0, 4)).toEqual({
      nextAttemptInTurn: 1,
      countFailedTurn: false,
      forceClickForTurn: false,
      forceGlobalClick: false,
    });
  });

  it("두 번째 실패는 현재 턴 클릭으로 전환하고 실패한 턴을 한 번 센다", () => {
    expect(resolveVoiceTurnFailure(1, 3)).toEqual({
      nextAttemptInTurn: 0,
      countFailedTurn: true,
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

  it("다섯 번째 실패 턴의 두 번째 실패에서만 전체 클릭 모드가 된다", () => {
    expect(resolveVoiceTurnFailure(1, 4)).toEqual({
      nextAttemptInTurn: 0,
      countFailedTurn: true,
      forceClickForTurn: true,
      forceGlobalClick: true,
    });
  });

  it.each(["dialogue", "incantation", "battle"] as const)(
    "%s permission/device-open 실패는 1회 재시도 후 현재 턴 click이다",
    () => {
      expect(resolveUnavailableVoiceFailure(true, 0, 0)).toMatchObject({
        forceClickForTurn: false,
        forceGlobalClick: false,
      });
      expect(resolveUnavailableVoiceFailure(true, 1, 0)).toMatchObject({
        forceClickForTurn: true,
        forceGlobalClick: false,
      });
    },
  );

  it("브라우저 녹음 API 자체 미지원만 즉시 전역 click이다", () => {
    expect(resolveUnavailableVoiceFailure(false, 0, 0)).toMatchObject({
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
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
