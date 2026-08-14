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
