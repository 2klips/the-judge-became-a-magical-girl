export interface VoiceTurnFailureDecision {
  readonly nextAttemptInTurn: number;
  readonly countFailedTurn: boolean;
  readonly forceClickForTurn: boolean;
  readonly forceGlobalClick: boolean;
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
  accumulatedFailedTurns: number,
): VoiceTurnFailureDecision {
  if (attemptInTurn <= 0) {
    return {
      nextAttemptInTurn: 1,
      countFailedTurn: false,
      forceClickForTurn: false,
      forceGlobalClick: false,
    };
  }
  return {
    nextAttemptInTurn: 0,
    countFailedTurn: true,
    forceClickForTurn: true,
    forceGlobalClick: accumulatedFailedTurns + 1 >= 5,
  };
}

export function resolveUnavailableVoiceFailure(
  recordingSupported: boolean,
  attemptInTurn: number,
  accumulatedFailedTurns: number,
): VoiceTurnFailureDecision & { readonly capabilityUnavailable: boolean } {
  if (!recordingSupported) {
    return {
      nextAttemptInTurn: 0,
      countFailedTurn: false,
      forceClickForTurn: true,
      forceGlobalClick: true,
      capabilityUnavailable: true,
    };
  }
  return {
    ...resolveVoiceTurnFailure(attemptInTurn, accumulatedFailedTurns),
    capabilityUnavailable: false,
  };
}

export function clearVoiceFailureAttempts(attempts: Map<string, number>): void {
  attempts.clear();
}
