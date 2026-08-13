import { describe, expect, it } from "vitest";
import {
  consumeDebugVoiceFailure,
  createPendingDebugVoiceFailure,
} from "../src/input/voiceFailureInjection";

describe("debug 음성 실패 주입", () => {
  it("production에서는 query를 무시한다", () => {
    expect(
      createPendingDebugVoiceFailure(
        "?debug=1&voiceFailure=network&voiceFailureCount=2",
        true,
        false,
      ),
    ).toEqual({ kind: null, remaining: 0 });
  });

  it("기본값은 다음 capture 한 번만 typed failure로 소비한다", () => {
    const pending = createPendingDebugVoiceFailure(
      "?debug=1&voiceFailure=permission",
      true,
      true,
    );

    expect(consumeDebugVoiceFailure(pending)).toEqual({
      kind: "permission",
      debugMessage: "debug injected permission",
    });
    expect(consumeDebugVoiceFailure(pending)).toBeNull();
  });

  it("수동 2회 실패 검수는 각 capture에서 한 항목씩 소비한다", () => {
    const pending = createPendingDebugVoiceFailure(
      "?debug=1&voiceFailure=network&voiceFailureCount=2",
      true,
      true,
    );

    expect(consumeDebugVoiceFailure(pending)?.kind).toBe("network");
    expect(consumeDebugVoiceFailure(pending)?.kind).toBe("network");
    expect(consumeDebugVoiceFailure(pending)).toBeNull();
  });
});
