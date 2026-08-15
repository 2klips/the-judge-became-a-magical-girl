import { describe, expect, it } from "vitest";
import {
  TITLE_MIC_STATES,
  isTitleMicVoiceCapable,
  presentTitleMic,
  reduceTitleMic,
} from "../src/ui/titleMicState";

describe("TITLE microphone state", () => {
  it("아홉 상태를 고정한다", () => {
    expect(TITLE_MIC_STATES).toEqual([
      "UNKNOWN",
      "REQUESTING_PERMISSION",
      "READY",
      "TESTING",
      "TEST_SUCCESS",
      "DENIED",
      "NO_DEVICE",
      "UNSUPPORTED",
      "ERROR",
    ]);
  });

  it("명시적 설정부터 지속 성공까지 전환한다", () => {
    let state = reduceTitleMic("UNKNOWN", { type: "REQUEST_SETUP" });
    expect(state).toBe("REQUESTING_PERMISSION");
    state = reduceTitleMic(state, { type: "PERMISSION_GRANTED" });
    expect(state).toBe("READY");
    state = reduceTitleMic(state, { type: "START_TEST" });
    expect(state).toBe("TESTING");
    state = reduceTitleMic(state, { type: "TEST_PASSED" });
    expect(state).toBe("TEST_SUCCESS");
    expect(reduceTitleMic(state, { type: "PERMISSION_GRANTED" })).toBe("TEST_SUCCESS");
    expect(reduceTitleMic(state, { type: "RETEST" })).toBe("TESTING");
    expect(reduceTitleMic("TEST_SUCCESS", { type: "DEVICE_CHANGED" })).toBe("READY");
    expect(reduceTitleMic("TEST_SUCCESS", { type: "STARTED_GAME" })).toBe("UNKNOWN");
  });

  it.each([
    [{ type: "PERMISSION_DENIED", canRequestAgain: false } as const, "DENIED"],
    [{ type: "NO_DEVICE" } as const, "NO_DEVICE"],
    [{ type: "UNSUPPORTED" } as const, "UNSUPPORTED"],
    [{ type: "FAILED" } as const, "ERROR"],
  ])("권한 요청 실패 %o를 %s로 분리한다", (event, expected) => {
    expect(reduceTitleMic("REQUESTING_PERMISSION", event)).toBe(expected);
  });

  it("READY와 TEST_SUCCESS만 voice-capable이다", () => {
    expect(TITLE_MIC_STATES.filter(isTitleMicVoiceCapable)).toEqual([
      "READY",
      "TEST_SUCCESS",
    ]);
  });

  it.each([
    ["UNKNOWN", {}, "음성 플레이", "목소리로 대답하고 직접 주문을 외칠 수 있습니다.\n마이크 없이도 플레이할 수 있습니다.", "마이크 설정"],
    ["REQUESTING_PERMISSION", {}, "마이크 확인 중", "사용 가능한 입력 장치를 확인하고 있습니다...", null],
    ["READY", { deviceLabel: "CORSAIR VOID WIRELESS v2" }, "마이크 준비됨", "CORSAIR VOID WIRELESS v2\n마이크 없이도 플레이할 수 있습니다.", "마이크 테스트"],
    ["TESTING", {}, "목소리를 확인하고 있어요.", "평소 목소리로 한 문장을 말해주세요.\n“심사를 시작합니다.”", null],
    ["TEST_SUCCESS", {}, "테스트 완료", "목소리가 정상적으로 확인되었습니다.", "다시 테스트"],
    ["DENIED", { canRequestAgain: true }, "마이크가 꺼져 있습니다.", "음성 플레이를 사용하려면 마이크 권한이 필요합니다.", "마이크 설정 안내"],
    ["DENIED", { canRequestAgain: false }, "마이크가 꺼져 있습니다.", "주소창의 사이트 설정에서 마이크 권한을 허용한 뒤 다시 확인해 주세요.", null],
    ["NO_DEVICE", {}, "사용 가능한 마이크가 없습니다.", "마이크를 연결한 뒤 다시 확인하거나 마이크 없이 플레이할 수 있습니다.", "다시 확인"],
    ["UNSUPPORTED", {}, "이 브라우저에서는 음성 플레이를 사용할 수 없습니다.", "마이크 없이 게임을 진행할 수 있습니다.", null],
    ["ERROR", {}, "마이크를 확인할 수 없습니다.", "잠시 후 다시 시도하거나 마이크 없이 플레이해 주세요.", "다시 시도"],
  ] as const)("%s 문구와 polite live를 고정한다", (state, context, heading, body, action) => {
    expect(presentTitleMic(state, context)).toEqual({ heading, body, action, live: "polite" });
  });
});
