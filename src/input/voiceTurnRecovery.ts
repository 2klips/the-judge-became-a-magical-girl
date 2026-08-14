import type { VoiceFailureKind } from "./transcription";

export interface VoiceTurnFailureDecision {
  readonly nextAttemptInTurn: number;
  readonly forceClickForTurn: boolean;
  readonly forceGlobalClick: boolean;
}

export interface TypedVoiceFailureDecision extends VoiceTurnFailureDecision {
  readonly failureKind: VoiceFailureKind;
  readonly capabilityUnavailable: boolean;
}

interface RecordedSttFailure {
  readonly state: { readonly sttFailCount: number };
}

export function formatVoiceTurnFailureMessage(
  baseMessage: string,
  next: "retry" | "click",
): string {
  return next === "retry"
    ? `${baseMessage} 같은 턴에서 한 번 더 말해 줘.`
    : `${baseMessage} 이 턴은 클릭으로 진행해 줘.`;
}

export function resolveVoiceTurnFailure(
  attemptInTurn: number,
  accumulatedInputFailures: number,
): VoiceTurnFailureDecision {
  if (accumulatedInputFailures >= 5) {
    return {
      nextAttemptInTurn: 0,
      forceClickForTurn: true,
      forceGlobalClick: true,
    };
  }
  if (attemptInTurn <= 0) {
    return {
      nextAttemptInTurn: 1,
      forceClickForTurn: false,
      forceGlobalClick: false,
    };
  }
  return {
    nextAttemptInTurn: 0,
    forceClickForTurn: true,
    forceGlobalClick: false,
  };
}

export function recordTypedVoiceFailure(
  failureKind: VoiceFailureKind,
  recordingSupported: boolean,
  attemptInTurn: number,
  recordFailure: () => RecordedSttFailure,
): TypedVoiceFailureDecision {
  if (!recordingSupported) {
    return {
      failureKind,
      nextAttemptInTurn: 0,
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
    };
  }
  const recordedFailure = recordFailure();
  return {
    failureKind,
    ...resolveVoiceTurnFailure(attemptInTurn, recordedFailure.state.sttFailCount),
    capabilityUnavailable: false,
  };
}

export function clearVoiceFailureAttempts(attempts: Map<string, number>): void {
  attempts.clear();
}
